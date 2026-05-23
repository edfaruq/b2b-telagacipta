import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { getDbPool } from "@/lib/db";
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
    const [rows] = await pool.query(
      `SELECT
         pg.id_pengiriman,
         pg.id_invoice,
         pg.nomor_resi,
         pg.tanggal_pengiriman,
         pg.tanggal_diterima,
         pg.rating,
         pg.feedback,
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
         AND pg.status_pengiriman = 'diterima'
       ORDER BY pg.tanggal_diterima DESC, pg.id_pengiriman DESC`
    );

    const orders = (
      rows as Array<{
        id_pengiriman: number;
        id_invoice: number;
        nomor_resi: string | null;
        tanggal_pengiriman: string | Date | null;
        tanggal_diterima: string | Date | null;
        rating: number | null;
        feedback: string | null;
        nomor_invoice: string;
        total_invoice: string | number;
        nama: string;
        email: string;
        instansi: string;
        nama_produk: string;
        ekspedisi: string;
        alamat_tujuan: string;
      }>
    ).map((row) => ({
      id_pengiriman: row.id_pengiriman,
      id_invoice: row.id_invoice,
      invoiceNumber: row.nomor_invoice,
      totalLabel: formatPriceIdr(Number(row.total_invoice) || 0),
      buyerName: row.nama,
      buyerEmail: row.email,
      institution: row.instansi,
      productName: row.nama_produk,
      expedition: (row.ekspedisi ?? "").trim(),
      deliveryAddress: row.alamat_tujuan,
      trackingNumber: row.nomor_resi?.trim() || "",
      shippedAt:
        row.tanggal_pengiriman instanceof Date
          ? row.tanggal_pengiriman.toISOString()
          : row.tanggal_pengiriman
            ? String(row.tanggal_pengiriman)
            : null,
      deliveredAt:
        row.tanggal_diterima instanceof Date
          ? row.tanggal_diterima.toISOString()
          : row.tanggal_diterima
            ? String(row.tanggal_diterima)
            : null,
      rating: row.rating != null ? Number(row.rating) : null,
      feedback: row.feedback?.trim() || "",
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[admin/order-history GET]", err);
    return NextResponse.json({ message: "Could not load order history." }, { status: 500 });
  }
}
