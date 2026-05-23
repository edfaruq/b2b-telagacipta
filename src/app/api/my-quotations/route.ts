import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { ensurePengirimanForAllPaidInvoices } from "@/lib/ensure-pengiriman";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";
import { invoiceStatusLabel } from "@/lib/invoice-status";
import { paymentRejectedMessage, paymentStatusLabel } from "@/lib/payment-status";
import { formatPenawaranFields } from "@/lib/penawaran";
import { shippingStatusLabel } from "@/lib/shipping-status";

type Row = {
  id_permintaan: number;
  jumlah_permintaan: string | number;
  alamat_tujuan: string;
  tanggal_permintaan: string | Date;
  nama_produk: string;
  slug: string;
  satuan: string;
  foto_produk: string;
  request_sequence: string | number;
  id_penawaran: number;
  harga_ton: string | number;
  biaya_pengiriman: string | number;
  ekspedisi: string;
  total_penawaran: string | number;
  tanggal_penawaran: string | Date;
  id_invoice: number | null;
  nomor_invoice: string | null;
  tanggal_invoice: string | Date | null;
  total_invoice: string | number | null;
  status_invoice: string | null;
  status_pembayaran: string | null;
  nomor_receipt: string | null;
  pembayaran_id: number | null;
  tanggal_validasi: string | Date | null;
  id_pengiriman: number | null;
  status_pengiriman: string | null;
  nomor_resi: string | null;
  tanggal_pengiriman: string | Date | null;
  tanggal_diterima: string | Date | null;
  rating: number | null;
  feedback: string | null;
  biteship_courier_code: string | null;
};

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json({ message: "Only buyer accounts can view quotations." }, { status: 403 });
  }

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);
    await ensurePengirimanForAllPaidInvoices(pool);

    const [rows] = await pool.query(
      `SELECT
         pm.id_permintaan,
         pm.jumlah_permintaan,
         pm.alamat_tujuan,
         pm.tanggal_permintaan,
         p.nama_produk,
         p.slug,
         p.satuan,
         p.foto_produk,
         (SELECT COUNT(*)
          FROM permintaan x
          WHERE x.id_pelanggan = pm.id_pelanggan
            AND x.id_permintaan <= pm.id_permintaan) AS request_sequence,
         pw.id_penawaran,
         pw.harga_ton,
         pw.biaya_pengiriman,
         pw.ekspedisi,
         pw.total_penawaran,
         pw.tanggal_penawaran,
         inv.id_invoice,
         inv.nomor_invoice,
         inv.tanggal_invoice,
         inv.total_invoice,
         inv.status_invoice,
         pb.status_pembayaran,
         pb.nomor_receipt,
         pb.tanggal_validasi,
         pb.id_pembayaran AS pembayaran_id,
         pg.id_pengiriman,
         pg.status_pengiriman,
         pg.nomor_resi,
         pg.tanggal_pengiriman,
         pg.tanggal_diterima,
         pg.rating,
         pg.feedback,
         pg.biteship_courier_code
       FROM permintaan pm
       INNER JOIN produk p ON p.id_produk = pm.id_produk
       INNER JOIN penawaran pw ON pw.id_permintaan = pm.id_permintaan
         AND pw.status_penawaran = 'disetujui'
       LEFT JOIN invoice inv ON inv.id_penawaran = pw.id_penawaran
       LEFT JOIN pembayaran pb ON pb.id_invoice = inv.id_invoice
       LEFT JOIN pengiriman pg ON pg.id_invoice = inv.id_invoice
       WHERE pm.id_pelanggan = ?
         AND pm.status_permintaan = 'disetujui'
       ORDER BY COALESCE(inv.tanggal_invoice, pw.tanggal_penawaran) DESC`,
      [session.userId]
    );

    const quotations = (rows as Row[]).map((row) => {
      const qty = Number(row.jumlah_permintaan) || 0;
      const satuan = (row.satuan || "kg").trim();
      const hargaTon = Number(row.harga_ton) || 0;
      const biaya = Number(row.biaya_pengiriman) || 0;
      const total = Number(row.total_penawaran) || 0;
      const formatted = formatPenawaranFields(hargaTon, qty, biaya, total, satuan);
      const requestedAt =
        row.tanggal_permintaan instanceof Date
          ? row.tanggal_permintaan.toISOString()
          : String(row.tanggal_permintaan);
      const acceptedAt =
        row.tanggal_penawaran instanceof Date
          ? row.tanggal_penawaran.toISOString()
          : String(row.tanggal_penawaran);

      const invoiceTotal = Number(row.total_invoice) || total;
      const invStatus = row.status_invoice ?? "belum_bayar";
      const shipRating = row.rating != null ? Number(row.rating) : null;
      const payStatus = row.status_pembayaran ?? null;
      const nomorReceipt = row.nomor_receipt;
      const pembayaranId = row.pembayaran_id;

      return {
        id: row.id_permintaan,
        penawaranId: row.id_penawaran,
        requestSequence: Number(row.request_sequence) || 1,
        productName: row.nama_produk,
        productSlug: row.slug,
        productImage: row.foto_produk?.trim() || "/images/logo-telagacipta.png",
        quantity: qty,
        unit: satuan,
        deliveryAddress: row.alamat_tujuan,
        requestedAt,
        acceptedAt,
        inOrderHistory:
          invStatus === "lunas" &&
          row.status_pengiriman === "diterima" &&
          shipRating != null &&
          shipRating >= 1,
        offer: {
          unitPriceLabel: formatted.hargaPerUnitLabel,
          shippingLabel: formatted.biayaPengirimanLabel,
          expedition: (row.ekspedisi ?? "").trim(),
          subtotalLabel: formatted.subtotalLabel,
          totalLabel: formatted.totalPenawaranLabel,
        },
        invoice: row.id_invoice
          ? {
              id: row.id_invoice,
              number: row.nomor_invoice ?? "",
              totalLabel: formatPriceIdr(invoiceTotal),
              status: invStatus,
              statusLabel: invoiceStatusLabel(invStatus),
              issuedAt:
                row.tanggal_invoice instanceof Date
                  ? row.tanggal_invoice.toISOString()
                  : row.tanggal_invoice
                    ? String(row.tanggal_invoice)
                    : acceptedAt,
              paymentStatus: payStatus,
              paymentStatusLabel: payStatus ? paymentStatusLabel(payStatus) : null,
              canPay: invStatus === "belum_bayar" && (payStatus === null || payStatus === "ditolak"),
              canDownloadPdf: invStatus === "lunas",
              paymentPending: payStatus === "menunggu_validasi",
              paymentRejected: payStatus === "ditolak",
              paymentRejectedMessage:
                payStatus === "ditolak" ? paymentRejectedMessage() : null,
              receipt:
                payStatus === "valid" && pembayaranId
                  ? {
                      id: pembayaranId,
                      number: nomorReceipt ?? "",
                    }
                  : null,
              shipping:
                invStatus === "lunas" && row.id_pengiriman && row.status_pengiriman
                  ? {
                      id: row.id_pengiriman,
                      status: row.status_pengiriman,
                      statusLabel: shippingStatusLabel(row.status_pengiriman),
                      trackingNumber: row.nomor_resi?.trim() || null,
                      expedition: (row.ekspedisi ?? "").trim(),
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
                      rating: shipRating,
                      feedback: row.feedback?.trim() || null,
                      canConfirmReceived: row.status_pengiriman === "dikirim",
                      canSubmitFeedback:
                        row.status_pengiriman === "diterima" &&
                        (row.rating == null || Number(row.rating) < 1),
                      biteshipCourierCode: row.biteship_courier_code?.trim() || null,
                      canTrackShipment:
                        row.status_pengiriman === "dikirim" ||
                        row.status_pengiriman === "diterima",
                    }
                  : null,
            }
          : null,
      };
    });

    return NextResponse.json({ quotations });
  } catch {
    return NextResponse.json({ message: "Could not load quotations." }, { status: 500 });
  }
}
