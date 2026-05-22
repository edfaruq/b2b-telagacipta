import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function savePaymentProof(
  invoiceId: number,
  file: File
): Promise<{ publicPath: string } | { error: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "File must be PNG, JPG, or WEBP." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File must be 5 MB or smaller." };
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  const dir = path.join(process.cwd(), "public", "uploads", "payments");
  await mkdir(dir, { recursive: true });

  const filename = `inv-${invoiceId}-${Date.now()}.${ext}`;
  const diskPath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buffer);

  return { publicPath: `/uploads/payments/${filename}` };
}
