import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { mapExpeditionToCourier } from "@/lib/shipping/courier-map";
import { markShipmentAsShipped } from "@/lib/shipping/mark-shipped";
import { shippingStatusLabel } from "@/lib/shipping-status";
import { getDbPool } from "@/lib/db";
import { ensurePengirimanForAllPaidInvoices } from "@/lib/ensure-pengiriman";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";
import { getServerSession } from "@/lib/get-server-session";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);
    await ensurePengirimanForAllPaidInvoices(pool);

    const [rows] = await pool.query(
      `SELECT
         pg.id_pengiriman,
         pg.id_invoice,
         pg.status_pengiriman,
         pg.nomor_resi,
         pg.tanggal_pengiriman,
         pg.tanggal_diterima,
         inv.nomor_invoice,
         inv.total_invoice,
         pl.nama,
         pl.email,
         pl.instansi,
         p.nama_produk,
         pw.ekspedisi,
         pm.alamat_tujuan
       FROM pengiriman pg
       INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
       INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
       INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
       INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
       INNER JOIN produk p ON p.id_produk = pm.id_produk
       WHERE inv.status_invoice = 'lunas'
         AND pg.status_pengiriman IN ('diproses', 'dikirim')
       ORDER BY
         CASE pg.status_pengiriman WHEN 'diproses' THEN 0 ELSE 1 END,
         pg.tanggal_pengiriman ASC,
         pg.id_pengiriman ASC`
    );

    const shipments = (
      rows as Array<{
        id_pengiriman: number;
        id_invoice: number;
        status_pengiriman: string;
        nomor_resi: string | null;
        tanggal_pengiriman: string | Date | null;
        tanggal_diterima: string | Date | null;
        nomor_invoice: string;
        total_invoice: string | number;
        nama: string;
        email: string;
        instansi: string;
        nama_produk: string;
        ekspedisi: string;
        alamat_tujuan: string;
      }>
    ).map((row) => {
      const expedition = (row.ekspedisi ?? "").trim();
      const courierMapped = mapExpeditionToCourier(expedition);

      return {
        id_pengiriman: row.id_pengiriman,
        id_invoice: row.id_invoice,
        status: row.status_pengiriman,
        statusLabel: shippingStatusLabel(row.status_pengiriman),
        trackingNumber: row.nomor_resi?.trim() || "",
        shippedAt:
          row.tanggal_pengiriman instanceof Date
            ? row.tanggal_pengiriman.toISOString()
            : row.tanggal_pengiriman
              ? String(row.tanggal_pengiriman)
              : null,
        invoiceNumber: row.nomor_invoice,
        totalLabel: formatPriceIdr(Number(row.total_invoice) || 0),
        buyerName: row.nama,
        buyerEmail: row.email,
        institution: row.instansi,
        productName: row.nama_produk,
        expedition,
        deliveryAddress: row.alamat_tujuan,
        canMarkShipped: row.status_pengiriman === "diproses",
        canAutoGenerateAwb:
          row.status_pengiriman === "diproses" && Boolean(courierMapped),
      };
    });

    return NextResponse.json({ shipments });
  } catch (err) {
    console.error("[admin/shipments GET]", err);
    return NextResponse.json({ message: "Could not load shipments." }, { status: 500 });
  }
}

type PatchBody = {
  id_pengiriman?: number;
  action?: "ship";
  nomor_resi?: string;
  auto_generate?: boolean;
  courier_type?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const idPengiriman = Number(body.id_pengiriman);
  if (!Number.isInteger(idPengiriman) || idPengiriman <= 0) {
    return NextResponse.json({ message: "Invalid shipment id." }, { status: 400 });
  }
  if (body.action !== "ship") {
    return NextResponse.json({ message: "Action must be ship." }, { status: 400 });
  }

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);

    const result = await markShipmentAsShipped(
      {
        idPengiriman,
        idAdmin: session.userId,
        nomorResi: body.nomor_resi,
        autoGenerate: body.auto_generate,
        courierType: body.courier_type,
      },
      pool
    );

    return NextResponse.json({
      message: result.message,
      trackingNumber: result.nomorResi,
      autoGenerated: result.autoGenerated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update shipment.";
    console.error("[admin/shipments PATCH]", err);
    const status = message.includes("not found") ? 404 : message.includes("processing") ? 409 : 400;
    return NextResponse.json({ message }, { status });
  }
}
