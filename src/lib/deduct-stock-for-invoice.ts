import type { Pool, PoolConnection } from "mysql2/promise";

type Queryable = Pool | PoolConnection;

export class StockDeductionError extends Error {
  readonly status = 409;

  constructor(message: string) {
    super(message);
    this.name = "StockDeductionError";
  }
}

/**
 * Decrease produk.stok for the line item on a newly paid invoice.
 * Call only after invoice transitions to `lunas` (same transaction).
 */
export async function deductStockForPaidInvoice(
  idInvoice: number,
  db: Queryable
): Promise<void> {
  const [rows] = await db.query(
    `SELECT pm.id_produk, pm.jumlah_permintaan, p.stok, p.nama_produk
     FROM invoice inv
     INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
     INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
     INNER JOIN produk p ON p.id_produk = pm.id_produk
     WHERE inv.id_invoice = ?
     LIMIT 1`,
    [idInvoice]
  );

  const row = (
    rows as Array<{
      id_produk: number;
      jumlah_permintaan: string | number;
      stok: number;
      nama_produk: string;
    }>
  )[0];

  if (!row) {
    throw new StockDeductionError("Product not found for this invoice.");
  }

  const qty = Math.round(Number(row.jumlah_permintaan));
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new StockDeductionError("Invalid order quantity for stock deduction.");
  }

  const [lockRows] = await db.query(
    `SELECT stok FROM produk WHERE id_produk = ? FOR UPDATE`,
    [row.id_produk]
  );
  const stok = Number((lockRows as Array<{ stok: number }>)[0]?.stok) || 0;

  if (stok < qty) {
    throw new StockDeductionError(
      `Insufficient stock for "${row.nama_produk}" (available: ${stok}, ordered: ${qty}).`
    );
  }

  const [upd] = await db.query(
    `UPDATE produk SET stok = stok - ? WHERE id_produk = ? AND stok >= ?`,
    [qty, row.id_produk, qty]
  );

  if ((upd as { affectedRows: number }).affectedRows === 0) {
    throw new StockDeductionError("Could not update product stock.");
  }
}
