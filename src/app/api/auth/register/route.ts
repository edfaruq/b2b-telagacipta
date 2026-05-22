import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

type RegisterPayload = {
  nama: string;
  instansi: string;
  email: string;
  password: string;
  no_telepon: string;
  alamat: string;
  negara: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<RegisterPayload>;
    const nama = (payload.nama ?? "").trim();
    const instansi = (payload.instansi ?? "").trim();
    const email = (payload.email ?? "").trim().toLowerCase();
    const password = payload.password ?? "";
    const noTelepon = (payload.no_telepon ?? "").trim();
    const alamat = (payload.alamat ?? "").trim();
    const negara = (payload.negara ?? "").trim();

    const errors: string[] = [];
    if (!nama) errors.push("Name is required.");
    if (!instansi) errors.push("Institution is required.");
    if (!email) errors.push("Email address is required.");
    if (!password) errors.push("Password is required.");
    if (!noTelepon) errors.push("Phone number is required.");
    if (!alamat) errors.push("Address is required.");
    if (!negara) errors.push("Country is required.");

    if (nama && nama.length > 60) errors.push("Name must be at most 60 characters.");
    if (instansi && instansi.length > 50) errors.push("Institution must be at most 50 characters.");
    if (noTelepon && !/^\d{1,15}$/.test(noTelepon)) errors.push("Phone number must contain only digits and be at most 15 digits.");
    if (alamat && alamat.length > 255) errors.push("Address must be at most 255 characters.");
    if (email && email.length > 50) errors.push("Email address must be at most 50 characters.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email address format.");
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      errors.push(
        "Password must be at least 8 characters and include uppercase, lowercase, and a special character."
      );
    }

    const pool = getDbPool();
    if (email) {
      const [existingRows] = await pool.query("SELECT id_pelanggan FROM pelanggan WHERE email = ? LIMIT 1", [email]);
      const existing = existingRows as Array<{ id_pelanggan: number }>;
      if (existing.length > 0) {
        errors.push("This email address is already registered.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ message: errors[0], errors }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    await pool.query(
      `INSERT INTO pelanggan
      (nama, instansi, email, password, no_telepon, alamat, negara, status_registrasi, tanggal_registrasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [nama, instansi, email, hashedPassword, noTelepon, alamat, negara]
    );

    return NextResponse.json(
      { message: "Registration successful. Your account is waiting for admin approval." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "A server error occurred during registration." }, { status: 500 });
  }
}
