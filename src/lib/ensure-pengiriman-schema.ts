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

/** Apply shipping column changes when db:migrate was not run (e.g. checksum mismatch). */
export async function ensurePengirimanSchema(db: Queryable = getDbPool()): Promise<void> {
  if (!(await hasColumn(db, "pengiriman", "tanggal_diterima"))) {
    await db.query(
      `ALTER TABLE pengiriman
         ADD COLUMN tanggal_diterima DATETIME NULL AFTER tanggal_pengiriman`
    );
  }

  const [adminCol] = await db.query(
    `SELECT IS_NULLABLE AS nullable
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pengiriman'
       AND COLUMN_NAME = 'id_admin'
     LIMIT 1`
  );
  const adminNullable = (adminCol as Array<{ nullable: string }>)[0]?.nullable === "YES";
  if (!adminNullable) {
    await db.query(
      `ALTER TABLE pengiriman MODIFY COLUMN id_admin INT UNSIGNED NULL`
    );
  }

  if (!(await hasColumn(db, "pengiriman", "rating"))) {
    await db.query(
      `ALTER TABLE pengiriman
         ADD COLUMN rating TINYINT UNSIGNED NULL AFTER tanggal_diterima`
    );
  }

  if (!(await hasColumn(db, "pengiriman", "feedback"))) {
    await db.query(
      `ALTER TABLE pengiriman
         ADD COLUMN feedback TEXT NULL AFTER rating`
    );
  }

  if (!(await hasColumn(db, "pengiriman", "biteship_order_id"))) {
    await db.query(
      `ALTER TABLE pengiriman
         ADD COLUMN biteship_order_id VARCHAR(64) NULL AFTER nomor_resi,
         ADD COLUMN biteship_courier_code VARCHAR(40) NULL AFTER biteship_order_id,
         ADD COLUMN biteship_courier_type VARCHAR(40) NULL AFTER biteship_courier_code`
    );
  }
}
