import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionValue } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { slugify } from "@/lib/product-slug";
import { parseThousandsId } from "@/lib/number-input";

async function ensureAdmin() {
  const cookieStore = await cookies();
  const session = parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  return session?.role === "admin";
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT id_produk, nama_produk, slug, deskripsi_singkat, deskripsi, asal_produk, satuan,
              harga_indikatif, stok, foto_produk, is_favorite, status
       FROM produk
       ORDER BY id_produk DESC`
    );
    return NextResponse.json({ products: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load products.";
    return NextResponse.json({ message, products: [] }, { status: 500 });
  }
}

async function allocateUniqueSlug(pool: ReturnType<typeof getDbPool>, nama: string) {
  const base = slugify(nama);
  for (let i = 0; i < 500; i++) {
    const candidate = i === 0 ? base : `${base}-${i}`;
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id_produk FROM produk WHERE slug = ? LIMIT 1",
      [candidate]
    );
    if (!rows.length) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function POST(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const foto = formData.get("foto_produk");
  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json({ message: "Product photo is required." }, { status: 400 });
  }
  if (foto.size > MAX_BYTES) {
    return NextResponse.json({ message: "Image size must be at most 5MB." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(foto.type)) {
    return NextResponse.json({ message: "Use a JPEG, PNG, WEBP, or GIF image." }, { status: 400 });
  }

  const nama_produk = String(formData.get("nama_produk") ?? "").trim();
  const deskripsi_singkat = String(formData.get("deskripsi_singkat") ?? "").trim();
  const deskripsi = String(formData.get("deskripsi") ?? "").trim();
  const asal_produk = String(formData.get("asal_produk") ?? "").trim();
  const satuan = String(formData.get("satuan") ?? "kg").trim() || "kg";
  const hargaRaw = String(formData.get("harga_indikatif") ?? "").trim();
  const stokRaw = String(formData.get("stok") ?? "").trim();
  const is_favorite =
    formData.get("is_favorite") === "1" || String(formData.get("is_favorite") ?? "") === "true";
  const statusRaw = String(formData.get("status") ?? "active");
  const status = statusRaw === "draft" ? "draft" : "active";

  if (!nama_produk || !deskripsi_singkat || !asal_produk || !hargaRaw || !stokRaw) {
    return NextResponse.json({ message: "Please fill in all required fields." }, { status: 400 });
  }
  if (deskripsi_singkat.length > 100) {
    return NextResponse.json({ message: "Short description must be at most 100 characters." }, { status: 400 });
  }

  const harga_indikatif = parseThousandsId(hargaRaw);
  const stok = Math.floor(parseThousandsId(stokRaw));
  if (!Number.isFinite(harga_indikatif) || harga_indikatif < 0) {
    return NextResponse.json({ message: "Invalid price." }, { status: 400 });
  }
  if (!Number.isInteger(stok) || stok < 0) {
    return NextResponse.json({ message: "Stock must be a whole number ≥ 0." }, { status: 400 });
  }

  const deskripsiFinal = deskripsi || deskripsi_singkat;

  const rawExt = path.extname(foto.name).slice(0, 12).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = allowedExt.includes(rawExt) ? rawExt : ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await foto.arrayBuffer());
  await writeFile(filePath, buffer);

  const fotoPath = `/uploads/products/${filename}`;

  const pool = getDbPool();
  let slug: string;
  try {
    slug = await allocateUniqueSlug(pool, nama_produk);
  } catch {
    return NextResponse.json({ message: "Failed to generate a unique slug." }, { status: 500 });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO produk (
        nama_produk, slug, deskripsi_singkat, deskripsi, asal_produk, satuan,
        harga_indikatif, stok, foto_produk, is_favorite, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_produk,
        slug,
        deskripsi_singkat,
        deskripsiFinal,
        asal_produk,
        satuan,
        harga_indikatif,
        stok,
        fotoPath,
        is_favorite ? 1 : 0,
        status,
      ]
    );
    const insertId = (result as { insertId: number }).insertId;
    return NextResponse.json({ ok: true, id: insertId, slug });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save product.";
    return NextResponse.json(
      {
        message:
          message.includes("Unknown column")
            ? "Database schema is out of date. Run: npm run db:migrate"
            : message,
      },
      { status: 500 }
    );
  }
}
