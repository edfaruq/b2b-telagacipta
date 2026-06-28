import { NextResponse } from "next/server";
import { mapExpeditionToCourier } from "@/lib/shipping/courier-map";
import {
  resolveCarrierStatus,
  toShipmentTimingContext,
} from "@/lib/shipping/arrival-estimate";
import { trackMockShipment } from "@/lib/shipping/mock-shipment";
import { canAutoCreateShipment } from "@/lib/shipping/shipping-provider";
import { getDbPool } from "@/lib/db";
import { getServerSession } from "@/lib/get-server-session";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  if (!canAutoCreateShipment()) {
    return NextResponse.json(
      { message: "Shipment tracking is not available right now." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const idPengiriman = Number(searchParams.get("id_pengiriman"));

  if (!Number.isInteger(idPengiriman) || idPengiriman <= 0) {
    return NextResponse.json({ message: "Provide id_pengiriman." }, { status: 400 });
  }

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);

    const [rows] = await pool.query(
      `SELECT
         pg.nomor_resi,
         pg.status_pengiriman,
         pg.tanggal_pengiriman,
         pg.tanggal_diterima,
         pw.ekspedisi,
         pm.id_pelanggan
       FROM pengiriman pg
       INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
       INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
       INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
       WHERE pg.id_pengiriman = ?
       LIMIT 1`,
      [idPengiriman]
    );

    const row = (
      rows as Array<{
        nomor_resi: string | null;
        status_pengiriman: string;
        tanggal_pengiriman: Date | string | null;
        tanggal_diterima: Date | string | null;
        ekspedisi: string | null;
        id_pelanggan: number;
      }>
    )[0];

    if (!row) {
      return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
    }

    if (session.role === "pelanggan" && row.id_pelanggan !== session.userId) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    const waybillId = row.nomor_resi?.trim() || "";
    if (!waybillId) {
      return NextResponse.json({ message: "Tracking number is not available yet." }, { status: 400 });
    }

    const expedition = (row.ekspedisi ?? "").trim();
    const mapped = mapExpeditionToCourier(expedition);
    const courierCode = mapped?.company ?? "mock";
    const shipmentTiming = toShipmentTimingContext(row);

    let tracking = await trackMockShipment(waybillId, courierCode, shipmentTiming ?? undefined);

    if (shipmentTiming) {
      tracking = {
        ...tracking,
        status: resolveCarrierStatus(tracking.status, shipmentTiming.shipmentStatus),
      };
    }

    return NextResponse.json({ tracking, mock: true });
  } catch (err) {
    console.error("[shipping/track]", err);
    return NextResponse.json({ message: "Could not load tracking." }, { status: 500 });
  }
}
