import { formatPriceIdr } from "@/lib/catalog-product";
import { getDbPool } from "@/lib/db";
import { formatPenawaranFields } from "@/lib/penawaran";
import { permintaanRequestIdLabel } from "@/lib/permintaan-request-id";

export type BuyerInvoiceRecord = {
  id: number;
  number: string;
  issuedAt: string;
  dueAt: string;
  total: number;
  totalLabel: string;
  status: string;
  requestIdLabel: string;
  buyer: {
    name: string;
    email: string;
    institution: string;
    phone: string;
  };
  billToLines: string[];
  productName: string;
  quantity: number;
  unit: string;
  lines: {
    unitPrice: string;
    quantity: string;
    subtotal: string;
    shipping: string;
    expedition: string;
    total: string;
  };
  payment: {
    id: number;
    status: string | null;
    proofUrl: string | null;
    receiptNumber: string | null;
  } | null;
};

export async function fetchBuyerInvoice(
  idInvoice: number,
  idPelanggan: number
): Promise<BuyerInvoiceRecord | null> {
  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT
       inv.id_invoice,
       inv.nomor_invoice,
       inv.tanggal_invoice,
       inv.total_invoice,
       inv.status_invoice,
       pm.jumlah_permintaan,
       pm.alamat_tujuan,
       pm.tanggal_permintaan,
       pl.nama AS nama_pelanggan,
       pl.email,
       pl.instansi,
       pl.no_telepon,
       p.nama_produk,
       p.satuan,
       pw.harga_ton,
       pw.biaya_pengiriman,
       pw.ekspedisi,
       pw.total_penawaran,
       pb.id_pembayaran,
       pb.status_pembayaran,
       pb.bukti_pembayaran,
       pb.nomor_receipt,
       (SELECT COUNT(*)
        FROM permintaan x
        WHERE x.id_pelanggan = pm.id_pelanggan
          AND x.id_permintaan <= pm.id_permintaan) AS request_sequence
     FROM invoice inv
     INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
     INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
     INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
     INNER JOIN produk p ON p.id_produk = pm.id_produk
     LEFT JOIN pembayaran pb ON pb.id_invoice = inv.id_invoice
     WHERE inv.id_invoice = ? AND pm.id_pelanggan = ?
     LIMIT 1`,
    [idInvoice, idPelanggan]
  );

  const row = (
    rows as Array<{
      id_invoice: number;
      nomor_invoice: string;
      tanggal_invoice: string | Date;
      total_invoice: string | number;
      status_invoice: string;
      jumlah_permintaan: string | number;
      alamat_tujuan: string;
      tanggal_permintaan: string | Date;
      nama_pelanggan: string;
      email: string;
      instansi: string;
      no_telepon: string;
      nama_produk: string;
      satuan: string;
      harga_ton: string | number;
      biaya_pengiriman: string | number;
      ekspedisi: string;
      total_penawaran: string | number;
      id_pembayaran: number | null;
      status_pembayaran: string | null;
      bukti_pembayaran: string | null;
      nomor_receipt: string | null;
      request_sequence: string | number;
    }>
  )[0];

  if (!row) return null;

  const qty = Number(row.jumlah_permintaan) || 0;
  const satuan = (row.satuan || "kg").trim();
  const hargaTon = Number(row.harga_ton) || 0;
  const biaya = Number(row.biaya_pengiriman) || 0;
  const total = Number(row.total_penawaran) || Number(row.total_invoice) || 0;
  const formatted = formatPenawaranFields(hargaTon, qty, biaya, total, satuan);
  const requestedAt =
    row.tanggal_permintaan instanceof Date
      ? row.tanggal_permintaan.toISOString()
      : String(row.tanggal_permintaan);
  const issuedAt =
    row.tanggal_invoice instanceof Date
      ? row.tanggal_invoice.toISOString()
      : String(row.tanggal_invoice);

  const dueDate = new Date(issuedAt);
  dueDate.setDate(dueDate.getDate() + 14);

  return {
    id: row.id_invoice,
    number: row.nomor_invoice,
    issuedAt,
    dueAt: dueDate.toISOString(),
    total,
    totalLabel: formatPriceIdr(Number(row.total_invoice) || total),
    status: row.status_invoice,
    requestIdLabel: permintaanRequestIdLabel(Number(row.request_sequence) || 1, requestedAt),
    buyer: {
      name: row.nama_pelanggan,
      email: row.email,
      institution: row.instansi,
      phone: row.no_telepon,
    },
    billToLines: [
      row.instansi?.trim() || row.nama_pelanggan,
      ...(row.instansi?.trim() ? [`Attn: ${row.nama_pelanggan}`] : []),
      row.alamat_tujuan,
      row.email,
    ],
    productName: row.nama_produk,
    quantity: qty,
    unit: satuan,
    lines: {
      unitPrice: formatted.hargaPerUnitLabel,
      quantity: `${qty} ${satuan}`,
      subtotal: formatted.subtotalLabel,
      shipping: formatted.biayaPengirimanLabel,
      expedition: (row.ekspedisi ?? "").trim(),
      total: formatted.totalPenawaranLabel,
    },
    payment: row.status_pembayaran
      ? {
          id: row.id_pembayaran!,
          status: row.status_pembayaran,
          proofUrl: row.bukti_pembayaran,
          receiptNumber: row.nomor_receipt,
        }
      : null,
  };
}
