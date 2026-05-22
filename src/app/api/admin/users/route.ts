import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionValue } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

type UserRow = {
  id_pelanggan: number;
  nama: string;
  instansi: string;
  email: string;
  no_telepon: string;
  alamat: string;
  negara: string;
  status_registrasi: "pending" | "valid" | "rejected";
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
    `SELECT id_pelanggan, nama, instansi, email, no_telepon, alamat, negara, status_registrasi, tanggal_registrasi
     FROM pelanggan
     ORDER BY tanggal_registrasi DESC`
  );

  return NextResponse.json({ users: rows as UserRow[] });
}
