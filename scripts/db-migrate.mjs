import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "database", "migrations");

dotenv.config({ path: path.join(projectRoot, ".env.local") });
dotenv.config({ path: path.join(projectRoot, ".env") });

function getEnv(name, fallback = "") {
  const value = process.env[name];
  if (value === undefined || value === "") {
    if (fallback !== "") return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function ensureDatabase(connection, dbName) {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
}

function hashSql(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function run() {
  const host = getEnv("DB_HOST");
  const port = Number(getEnv("DB_PORT", "3306"));
  const user = getEnv("DB_USER");
  const password = process.env.DB_PASSWORD ?? "";
  const dbName = getEnv("DB_NAME");

  const bootstrap = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  await ensureDatabase(bootstrap, dbName);
  await bootstrap.end();

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
    multipleStatements: true,
  });

  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      checksum CHAR(64) NOT NULL,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const [rows] = await connection.query("SELECT filename, checksum FROM schema_migrations");
  const executed = new Map(rows.map((row) => [row.filename, row.checksum]));

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log("No migration files found.");
    await connection.end();
    return;
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = await fs.readFile(filePath, "utf8");
    const checksum = hashSql(sql);
    const previousChecksum = executed.get(file);

    if (previousChecksum) {
      if (previousChecksum !== checksum) {
        throw new Error(`Checksum mismatch for migration ${file}. Create a new migration file instead of editing applied one.`);
      }
      console.log(`skip ${file}`);
      continue;
    }

    console.log(`apply ${file}`);
    await connection.beginTransaction();
    try {
      await connection.query(sql);
      await connection.query(
        "INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)",
        [file, checksum]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  await connection.end();
  console.log("Migration complete.");
}

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
