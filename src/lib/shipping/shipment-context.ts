import type { Pool, PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";

type Queryable = Pool | PoolConnection;

export type ShipmentContext = {
  id_pengiriman: number;
  id_invoice: number;
  status_pengiriman: string;
  nomor_invoice: string;
  total_invoice: number;
  ekspedisi: string;
  alamat_tujuan: string;
  negara: string;
  jumlah_permintaan: number;
  nama_produk: string;
  nama: string;
  email: string;
  no_telepon: string | number;
};

export async function loadShipmentContext(
  idPengiriman: number,
  db: Queryable = getDbPool()
): Promise<ShipmentContext | null> {
  const [rows] = await db.query(
    `SELECT
       pg.id_pengiriman,
       pg.id_invoice,
       pg.status_pengiriman,
       inv.nomor_invoice,
       inv.total_invoice,
       pw.ekspedisi,
       pm.alamat_tujuan,
       COALESCE(NULLIF(pl.negara, ''), 'Indonesia') AS negara,
       pm.jumlah_permintaan,
       p.nama_produk,
       pl.nama,
       pl.email,
       pl.no_telepon
     FROM pengiriman pg
     INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
     INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
     INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
     INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
     INNER JOIN produk p ON p.id_produk = pm.id_produk
     WHERE pg.id_pengiriman = ?
       AND inv.status_invoice = 'lunas'
     LIMIT 1`,
    [idPengiriman]
  );

  const row = (rows as ShipmentContext[])[0];
  return row ?? null;
}

export async function loadQuotationRateContext(
  idPermintaan: number,
  db: Queryable = getDbPool()
): Promise<{
  id_permintaan: number;
  alamat_tujuan: string;
  jumlah_permintaan: number;
  nama_produk: string;
  harga_indikatif: number;
  ekspedisi: string;
  negara: string;
} | null> {
  const [rows] = await db.query(
    `SELECT
       pm.id_permintaan,
       pm.alamat_tujuan,
       pm.jumlah_permintaan,
       p.nama_produk,
       p.harga_indikatif,
       COALESCE(NULLIF(pw.ekspedisi, ''), '') AS ekspedisi,
       COALESCE(NULLIF(pl.negara, ''), 'Indonesia') AS negara
     FROM permintaan pm
     INNER JOIN produk p ON p.id_produk = pm.id_produk
     INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
     LEFT JOIN penawaran pw ON pw.id_permintaan = pm.id_permintaan
     WHERE pm.id_permintaan = ?
     LIMIT 1`,
    [idPermintaan]
  );

  const row = (
    rows as Array<{
      id_permintaan: number;
      alamat_tujuan: string;
      jumlah_permintaan: number;
      nama_produk: string;
      harga_indikatif: number;
      ekspedisi: string;
      negara: string;
    }>
  )[0];

  return row ?? null;
}
