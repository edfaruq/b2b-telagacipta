import type { Pool, PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";

type Queryable = Pool | PoolConnection;

async function hasColumn(
  db: Queryable,
  table: string,
  column: string
): Promise<boolean> {
  const [rows] = await db.query(
    `SELECT 1 AS ok
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  );
  return (rows as Array<{ ok: number }>).length > 0;
}

export async function ensurePelangganSchema(db: Queryable = getDbPool()): Promise<void> {
  if (!(await hasColumn(db, "pelanggan", "foto_profil"))) {
    await db.query(
      `ALTER TABLE pelanggan
         ADD COLUMN foto_profil VARCHAR(255) NOT NULL DEFAULT '' AFTER negara`
    );
  }
}
