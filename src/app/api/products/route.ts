import { NextResponse } from "next/server";
import { rowToCatalogProductList, type ProdukRow } from "@/lib/catalog-product";
import { getDbPool } from "@/lib/db";

/** Cache respons daftar produk (data jarang berubah setiap detik). */
export const revalidate = 60;

const LIST_CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

export async function GET() {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT id_produk, nama_produk, slug, deskripsi_singkat, asal_produk, satuan,
              harga_indikatif, stok, foto_produk, is_favorite, status
       FROM produk
       WHERE status = 'active'
       ORDER BY id_produk DESC`
    );
    const products = (rows as ProdukRow[]).map(rowToCatalogProductList);
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": LIST_CACHE_HEADER } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    const status = message.includes("Unknown column") ? 503 : 500;
    return NextResponse.json(
      {
        products: [],
        message:
          status === 503
            ? "Skema database belum lengkap. Jalankan: npm run db:migrate"
            : message,
      },
      { status }
    );
  }
}
