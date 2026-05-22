import type { PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";

/** Display invoice number: INV + YYMMDD + 4-digit daily sequence. */
export function formatInvoiceNumber(sequence: number, invoiceDate?: string | Date): string {
  const seq = Math.max(1, Math.floor(Number(sequence)) || 1);
  const date = invoiceDate ? new Date(invoiceDate) : new Date();

  if (Number.isNaN(date.getTime())) {
    return `INV${String(seq).padStart(10, "0")}`;
  }

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seqPart = String(seq).padStart(4, "0");

  return `INV${yy}${mm}${dd}${seqPart}`;
}

export function invoiceNumberLabel(nomorInvoice: string): string {
  return `Invoice No: ${nomorInvoice}`;
}

/** Next sequence = count of invoices issued on the same calendar day (in transaction). */
export async function nextInvoiceSequence(
  executor: PoolConnection | ReturnType<typeof getDbPool>,
  forDate: Date = new Date()
): Promise<number> {
  const y = forDate.getFullYear();
  const m = forDate.getMonth() + 1;
  const d = forDate.getDate();

  const [rows] = await executor.query(
    `SELECT COUNT(*) AS c FROM invoice
     WHERE YEAR(tanggal_invoice) = ? AND MONTH(tanggal_invoice) = ? AND DAY(tanggal_invoice) = ?`,
    [y, m, d]
  );

  const count = Number((rows as Array<{ c: number }>)[0]?.c) || 0;
  return count + 1;
}

export async function generateUniqueInvoiceNumber(
  conn: PoolConnection,
  forDate: Date = new Date()
): Promise<string> {
  let sequence = await nextInvoiceSequence(conn, forDate);
  let nomor = formatInvoiceNumber(sequence, forDate);

  for (let attempt = 0; attempt < 5; attempt++) {
    const [existing] = await conn.query(
      "SELECT id_invoice FROM invoice WHERE nomor_invoice = ? LIMIT 1",
      [nomor]
    );
    if ((existing as unknown[]).length === 0) {
      return nomor;
    }
    sequence += 1;
    nomor = formatInvoiceNumber(sequence, forDate);
  }

  return `${nomor}-${Date.now().toString(36).slice(-4)}`;
}
