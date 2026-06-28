import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionValue } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { parseThousandsId } from "@/lib/number-input";

async function ensureAdmin() {
  const cookieStore = await cookies();
  const session = parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  return session?.role === "admin";
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const idProduk = Number(id);
  if (!Number.isInteger(idProduk) || idProduk <= 0) {
    return NextResponse.json({ message: "Invalid product ID." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data" }, { status: 400 });
  }

  const pool = getDbPool();
  const [existingRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id_produk, foto_produk FROM produk WHERE id_produk = ? LIMIT 1`,
    [idProduk]
  );
  if (!existingRows.length) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }
  const existingFoto = String(existingRows[0].foto_produk ?? "").trim();

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

  const foto = formData.get("foto_produk");
  let fotoPath = existingFoto;
  if (foto instanceof File && foto.size > 0) {
    if (foto.size > MAX_BYTES) {
      return NextResponse.json({ message: "Image size must be at most 5MB." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(foto.type)) {
      return NextResponse.json({ message: "Use a JPEG, PNG, WEBP, or GIF image." }, { status: 400 });
    }
    const rawExt = path.extname(foto.name).slice(0, 12).toLowerCase();
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const ext = allowedExt.includes(rawExt) ? rawExt : ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, Buffer.from(await foto.arrayBuffer()));
    fotoPath = `/uploads/products/${filename}`;
  }

  try {
    await pool.execute(
      `UPDATE produk SET
        nama_produk = ?, deskripsi_singkat = ?, deskripsi = ?, asal_produk = ?, satuan = ?,
        harga_indikatif = ?, stok = ?, foto_produk = ?, is_favorite = ?, status = ?
       WHERE id_produk = ?`,
      [
        nama_produk,
        deskripsi_singkat,
        deskripsiFinal,
        asal_produk,
        satuan,
        harga_indikatif,
        stok,
        fotoPath,
        is_favorite ? 1 : 0,
        status,
        idProduk,
      ]
    );
    return NextResponse.json({ ok: true, id: idProduk });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update product.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
