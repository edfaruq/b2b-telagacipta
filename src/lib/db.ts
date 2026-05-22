import mysql from "mysql2/promise";

/** Survive Next.js dev HMR — avoids orphaned pools ("Too many connections"). */
const globalForDb = globalThis as typeof globalThis & {
  mysqlPool?: mysql.Pool;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbPool() {
  if (globalForDb.mysqlPool) {
    return globalForDb.mysqlPool;
  }

  const limit = Number(process.env.DB_CONNECTION_LIMIT ?? "5");

  globalForDb.mysqlPool = mysql.createPool({
    host: getRequiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? "3306"),
    user: getRequiredEnv("DB_USER"),
    password: process.env.DB_PASSWORD ?? "",
    database: getRequiredEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: Number.isFinite(limit) && limit > 0 ? limit : 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    queueLimit: 0,
    connectTimeout: 10_000,
    enableKeepAlive: true,
  });

  return globalForDb.mysqlPool;
}
