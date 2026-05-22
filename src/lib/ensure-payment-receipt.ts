import type { PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { generateUniqueReceiptNumber } from "@/lib/receipt-number";

type PaymentRow = {
  id_pembayaran: number;
  status_pembayaran: string;
  nomor_receipt: string | null;
  tanggal_validasi: string | Date | null;
  tanggal_pembayaran: string | Date;
};

function formatValidationDate(row: PaymentRow): string {
  if (row.tanggal_validasi instanceof Date) {
    return row.tanggal_validasi.toISOString();
  }
  if (row.tanggal_validasi) {
    return String(row.tanggal_validasi);
  }
  if (row.tanggal_pembayaran instanceof Date) {
    return row.tanggal_pembayaran.toISOString();
  }
  return String(row.tanggal_pembayaran);
}

/** Generate receipt number for legacy valid payments that predate the receipt feature. */
export async function ensurePaymentReceipt(
  idPembayaran: number,
  existingConn?: PoolConnection
): Promise<{ nomor_receipt: string; tanggal_validasi: string } | null> {
  const pool = getDbPool();

  const [rows] = await pool.query(
    `SELECT id_pembayaran, status_pembayaran, nomor_receipt, tanggal_validasi, tanggal_pembayaran
     FROM pembayaran WHERE id_pembayaran = ? LIMIT 1`,
    [idPembayaran]
  );

  const row = (rows as PaymentRow[])[0];
  if (!row || row.status_pembayaran !== "valid") {
    return null;
  }

  if (row.nomor_receipt) {
    return { nomor_receipt: row.nomor_receipt, tanggal_validasi: formatValidationDate(row) };
  }

  const conn = existingConn ?? (await pool.getConnection());
  const mustRelease = !existingConn;

  try {
    if (mustRelease) await conn.beginTransaction();

    const validationDate =
      row.tanggal_validasi instanceof Date
        ? row.tanggal_validasi
        : row.tanggal_validasi
          ? new Date(row.tanggal_validasi)
          : row.tanggal_pembayaran instanceof Date
            ? row.tanggal_pembayaran
            : new Date(row.tanggal_pembayaran);

    const nomorReceipt = await generateUniqueReceiptNumber(conn, validationDate);

    const [upd] = await conn.query(
      `UPDATE pembayaran
       SET nomor_receipt = ?, tanggal_validasi = COALESCE(tanggal_validasi, ?)
       WHERE id_pembayaran = ? AND status_pembayaran = 'valid' AND nomor_receipt IS NULL`,
      [nomorReceipt, validationDate, idPembayaran]
    );

    if ((upd as { affectedRows: number }).affectedRows === 0) {
      const [again] = await conn.query(
        "SELECT nomor_receipt, tanggal_validasi, tanggal_pembayaran FROM pembayaran WHERE id_pembayaran = ? LIMIT 1",
        [idPembayaran]
      );
      const refreshed = (again as PaymentRow[])[0];
      if (mustRelease) await conn.commit();
      if (!refreshed?.nomor_receipt) return null;
      return {
        nomor_receipt: refreshed.nomor_receipt,
        tanggal_validasi: formatValidationDate(refreshed),
      };
    }

    if (mustRelease) await conn.commit();

    return {
      nomor_receipt: nomorReceipt,
      tanggal_validasi:
        validationDate instanceof Date ? validationDate.toISOString() : String(validationDate),
    };
  } catch (err) {
    if (mustRelease) await conn.rollback();
    throw err;
  } finally {
    if (mustRelease) conn.release();
  }
}
