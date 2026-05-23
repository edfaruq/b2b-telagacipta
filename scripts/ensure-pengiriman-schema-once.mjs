import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME,
});

async function hasColumn(column) {
  const [rows] = await connection.query(
    `SELECT 1 AS ok FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengiriman' AND COLUMN_NAME = ?
     LIMIT 1`,
    [column]
  );
  return rows.length > 0;
}

if (!(await hasColumn("tanggal_diterima"))) {
  await connection.query(
    `ALTER TABLE pengiriman ADD COLUMN tanggal_diterima DATETIME NULL AFTER tanggal_pengiriman`
  );
  console.log("Added tanggal_diterima");
}

const [adminCol] = await connection.query(
  `SELECT IS_NULLABLE AS nullable FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengiriman' AND COLUMN_NAME = 'id_admin' LIMIT 1`
);
if (adminCol[0]?.nullable !== "YES") {
  await connection.query(`ALTER TABLE pengiriman MODIFY COLUMN id_admin INT UNSIGNED NULL`);
  console.log("Made id_admin nullable");
}

if (!(await hasColumn("rating"))) {
  await connection.query(
    `ALTER TABLE pengiriman ADD COLUMN rating TINYINT UNSIGNED NULL AFTER tanggal_diterima`
  );
  console.log("Added rating");
}

if (!(await hasColumn("feedback"))) {
  await connection.query(
    `ALTER TABLE pengiriman ADD COLUMN feedback TEXT NULL AFTER rating`
  );
  console.log("Added feedback");
}

if (!(await hasColumn("biteship_order_id"))) {
  await connection.query(
    `ALTER TABLE pengiriman
       ADD COLUMN biteship_order_id VARCHAR(64) NULL AFTER nomor_resi,
       ADD COLUMN biteship_courier_code VARCHAR(40) NULL AFTER biteship_order_id,
       ADD COLUMN biteship_courier_type VARCHAR(40) NULL AFTER biteship_courier_code`
  );
  console.log("Added Biteship columns");
}

const [cols] = await connection.query(
  `SELECT COLUMN_NAME FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengiriman'
   AND COLUMN_NAME IN ('tanggal_diterima','rating','feedback','id_admin')`
);
console.log("Columns:", cols.map((r) => r.COLUMN_NAME).join(", "));
await connection.end();
