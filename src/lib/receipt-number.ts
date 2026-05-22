import type { PoolConnection } from "mysql2/promise";

/** Display receipt number: RCP + YYMMDD + 4-digit daily sequence. */
export function formatReceiptNumber(sequence: number, receiptDate?: string | Date): string {
  const seq = Math.max(1, Math.floor(Number(sequence)) || 1);
  const date = receiptDate ? new Date(receiptDate) : new Date();

  if (Number.isNaN(date.getTime())) {
    return `RCP${String(seq).padStart(10, "0")}`;
  }

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seqPart = String(seq).padStart(4, "0");

  return `RCP${yy}${mm}${dd}${seqPart}`;
}

export async function nextReceiptSequence(
  conn: PoolConnection,
  forDate: Date = new Date()
): Promise<number> {
  const y = forDate.getFullYear();
  const m = forDate.getMonth() + 1;
  const d = forDate.getDate();

  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM pembayaran
     WHERE nomor_receipt IS NOT NULL
       AND YEAR(tanggal_validasi) = ? AND MONTH(tanggal_validasi) = ? AND DAY(tanggal_validasi) = ?`,
    [y, m, d]
  );

  const count = Number((rows as Array<{ c: number }>)[0]?.c) || 0;
  return count + 1;
}

export async function generateUniqueReceiptNumber(
  conn: PoolConnection,
  forDate: Date = new Date()
): Promise<string> {
  let sequence = await nextReceiptSequence(conn, forDate);
  let nomor = formatReceiptNumber(sequence, forDate);

  for (let attempt = 0; attempt < 5; attempt++) {
    const [existing] = await conn.query(
      "SELECT id_pembayaran FROM pembayaran WHERE nomor_receipt = ? LIMIT 1",
      [nomor]
    );
    if ((existing as unknown[]).length === 0) {
      return nomor;
    }
    sequence += 1;
    nomor = formatReceiptNumber(sequence, forDate);
  }

  return `${nomor}-${Date.now().toString(36).slice(-4)}`;
}
