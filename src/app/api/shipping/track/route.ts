import { NextResponse } from "next/server";
import { BiteshipApiError } from "@/lib/biteship/client";
import { trackByOrderId, trackByWaybill } from "@/lib/biteship/tracking";
import { trackMockShipment } from "@/lib/shipping/mock-shipment";
import { canAutoCreateShipment, isMockShippingEnabled } from "@/lib/shipping/shipping-provider";
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
  const waybill = (searchParams.get("waybill") ?? "").trim();
  const courier = (searchParams.get("courier") ?? "").trim().toLowerCase();
  const idPengiriman = Number(searchParams.get("id_pengiriman"));

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);

    let waybillId = waybill;
    let courierCode = courier;
    let biteshipOrderId: string | null = null;

    if (Number.isInteger(idPengiriman) && idPengiriman > 0) {
      const [rows] = await pool.query(
        `SELECT
           pg.nomor_resi,
           pg.biteship_order_id,
           pg.biteship_courier_code,
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
          biteship_order_id: string | null;
          biteship_courier_code: string | null;
          id_pelanggan: number;
        }>
      )[0];

      if (!row) {
        return NextResponse.json({ message: "Shipment not found." }, { status: 404 });
      }

      if (session.role === "pelanggan" && row.id_pelanggan !== session.userId) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
      }

      waybillId = waybill || row.nomor_resi?.trim() || "";
      courierCode = courier || row.biteship_courier_code?.trim().toLowerCase() || "";
      biteshipOrderId = row.biteship_order_id?.trim() || null;
    } else if (session.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    let tracking;
    if (isMockShippingEnabled()) {
      const mockWaybill = waybillId || biteshipOrderId || "";
      if (!mockWaybill) {
        return NextResponse.json(
          { message: "Provide id_pengiriman or a tracking number." },
          { status: 400 }
        );
      }
      tracking = await trackMockShipment(mockWaybill, courierCode || "mock");
    } else if (biteshipOrderId && !waybill) {
      tracking = await trackByOrderId(biteshipOrderId);
    } else if (waybillId && courierCode) {
      tracking = await trackByWaybill(waybillId, courierCode);
    } else if (biteshipOrderId) {
      tracking = await trackByOrderId(biteshipOrderId);
    } else {
      return NextResponse.json(
        { message: "Provide id_pengiriman or both waybill and courier parameters." },
        { status: 400 }
      );
    }

    return NextResponse.json({ tracking, mock: isMockShippingEnabled() });
  } catch (err) {
    if (err instanceof BiteshipApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status >= 400 ? err.status : 502 });
    }
    console.error("[shipping/track]", err);
    return NextResponse.json({ message: "Could not load tracking." }, { status: 500 });
  }
}
