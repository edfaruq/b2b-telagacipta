import type { Pool, PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";

type Queryable = Pool | PoolConnection;

/** Create pengiriman (diproses) when an invoice is marked paid, if missing. */
export async function ensurePengirimanForInvoice(
  idInvoice: number,
  idAdmin: number | null,
  db: Queryable = getDbPool()
): Promise<void> {
  await ensurePengirimanSchema(db);
  const [rows] = await db.query(
    "SELECT id_pengiriman FROM pengiriman WHERE id_invoice = ? LIMIT 1",
    [idInvoice]
  );
  if ((rows as Array<{ id_pengiriman: number }>)[0]) {
    return;
  }

  await db.query(
    `INSERT INTO pengiriman (id_invoice, id_admin, status_pengiriman)
     VALUES (?, ?, 'diproses')`,
    [idInvoice, idAdmin]
  );
}

/** Backfill pengiriman for paid invoices (e.g. before shipping feature existed). */
export async function ensurePengirimanForAllPaidInvoices(db: Queryable = getDbPool()): Promise<void> {
  await ensurePengirimanSchema(db);
  await db.query(
    `INSERT INTO pengiriman (id_invoice, id_admin, status_pengiriman)
     SELECT inv.id_invoice, NULL, 'diproses'
     FROM invoice inv
     LEFT JOIN pengiriman pg ON pg.id_invoice = inv.id_invoice
     WHERE inv.status_invoice = 'lunas' AND pg.id_pengiriman IS NULL`
  );
}
