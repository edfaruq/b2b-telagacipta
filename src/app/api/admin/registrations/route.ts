import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionValue } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

type PendingUserRow = {
  id_pelanggan: number;
  nama: string;
  instansi: string;
  email: string;
  no_telepon: string;
  alamat: string;
  negara: string;
  tanggal_registrasi: string;
};

async function ensureAdmin() {
  const cookieStore = await cookies();
  const session = parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  return session?.role === "admin";
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const pool = getDbPool();
  const [rows] = await pool.query(
    `SELECT id_pelanggan, nama, instansi, email, no_telepon, alamat, negara, tanggal_registrasi
     FROM pelanggan
     WHERE status_registrasi = 'pending'
     ORDER BY tanggal_registrasi ASC`
  );

  return NextResponse.json({ users: rows as PendingUserRow[] });
}

export async function PATCH(request: Request) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as { id_pelanggan?: number; action?: "approve" | "reject" };
  const idPelanggan = Number(payload.id_pelanggan);
  const action = payload.action === "reject" ? "reject" : "approve";
  if (!Number.isInteger(idPelanggan) || idPelanggan <= 0) {
    return NextResponse.json({ message: "Invalid id_pelanggan." }, { status: 400 });
  }

  const pool = getDbPool();
  const nextStatus = action === "approve" ? "valid" : "rejected";
  const [result] = await pool.query(
    "UPDATE pelanggan SET status_registrasi = ? WHERE id_pelanggan = ?",
    [nextStatus, idPelanggan]
  );
  const affectedRows = (result as { affectedRows: number }).affectedRows;
  if (affectedRows === 0) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    message: action === "approve" ? "User approved successfully." : "User rejected successfully.",
  });
}
