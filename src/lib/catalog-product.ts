import type { RowDataPacket } from "mysql2";

export type ProdukRow = RowDataPacket & {
  id_produk: number;
  nama_produk: string;
  slug: string;
  deskripsi_singkat: string;
  deskripsi: string;
  asal_produk: string;
  satuan: string;
  harga_indikatif: string | number;
  stok: number;
  foto_produk: string;
  is_favorite: number | boolean;
  status: string;
};

const SELLER = "Telaga Cipta Indonesia";

export function formatPriceIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace("IDR", "Rp")
    .trim();
}

type ProdukListRow = Omit<ProdukRow, "deskripsi"> & { deskripsi?: string };

function mapProductBase(row: ProdukRow | ProdukListRow) {
  const harga = typeof row.harga_indikatif === "string" ? Number(row.harga_indikatif) : row.harga_indikatif;
  const price = formatPriceIdr(Number.isFinite(harga) ? harga : 0);
  const unit = `/${row.satuan || "kg"}`;
  const fav = row.is_favorite === true || row.is_favorite === 1;
  const img = row.foto_produk?.trim() ? row.foto_produk : "/images/logo-telagacipta.png";
  const shortDesc =
    row.deskripsi_singkat ||
    ("deskripsi" in row && row.deskripsi ? row.deskripsi.slice(0, 160) : "");

  return {
    slug: row.slug,
    title: row.nama_produk,
    description: shortDesc,
    origin: row.asal_produk,
    seller: SELLER,
    price,
    unit,
    image: img,
    favorite: fav,
    stock: Number(row.stok) || 0,
  };
}

/** Daftar katalog — tanpa kolom deskripsi panjang (lebih cepat). */
export function rowToCatalogProductList(row: ProdukListRow) {
  return mapProductBase(row);
}

/** Detail produk — termasuk deskripsi lengkap. */
export function rowToCatalogProduct(row: ProdukRow) {
  return {
    ...mapProductBase(row),
    longDescription: row.deskripsi || row.deskripsi_singkat || "",
  };
}
