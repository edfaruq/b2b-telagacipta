import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { ensurePelangganSchema } from "@/lib/ensure-pelanggan-schema";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function requireBuyerSession() {
  const session = await getServerSession();
  if (!session) {
    return { error: NextResponse.json({ message: "Not authenticated." }, { status: 401 }) };
  }
  if (session.role !== "pelanggan") {
    return { error: NextResponse.json({ message: "Buyer account required." }, { status: 403 }) };
  }
  return { session };
}

export async function POST(request: Request) {
  const auth = await requireBuyerSession();
  if ("error" in auth) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("foto_profil");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Please choose a photo to upload." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: "Image size must be at most 5MB." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: "Use a JPEG, PNG, WEBP, or GIF image." }, { status: 400 });
  }

  const rawExt = path.extname(file.name).slice(0, 12).toLowerCase();
  const allowedExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = allowedExt.includes(rawExt) ? rawExt : ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  const fotoPath = `/uploads/profiles/${filename}`;

  try {
    const pool = getDbPool();
    await ensurePelangganSchema(pool);
    await pool.execute("UPDATE pelanggan SET foto_profil = ? WHERE id_pelanggan = ?", [
      fotoPath,
      auth.session.userId,
    ]);
    return NextResponse.json({ message: "Profile photo updated.", foto_profil: fotoPath });
  } catch {
    return NextResponse.json({ message: "Could not save profile photo." }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await requireBuyerSession();
  if ("error" in auth) return auth.error;

  try {
    const pool = getDbPool();
    await ensurePelangganSchema(pool);
    await pool.execute("UPDATE pelanggan SET foto_profil = '' WHERE id_pelanggan = ?", [
      auth.session.userId,
    ]);
    return NextResponse.json({ message: "Profile photo removed.", foto_profil: "" });
  } catch {
    return NextResponse.json({ message: "Could not remove profile photo." }, { status: 500 });
  }
}
