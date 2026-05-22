import { NextResponse } from "next/server";
import { rowToCatalogProduct, type ProdukRow } from "@/lib/catalog-product";
import { getDbPool } from "@/lib/db";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ message: "Missing slug" }, { status: 400 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT id_produk, nama_produk, slug, deskripsi_singkat, deskripsi, asal_produk, satuan,
              harga_indikatif, stok, foto_produk, is_favorite, status
       FROM produk
       WHERE slug = ? AND status = 'active'
       LIMIT 1`,
      [slug]
    );
    const list = rows as ProdukRow[];
    if (!list.length) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product: rowToCatalogProduct(list[0]) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
