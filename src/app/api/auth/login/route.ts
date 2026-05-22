import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, buildSessionValue, verifyPassword } from "@/lib/auth";
import { getDbPool } from "@/lib/db";

type LoginPayload = {
  email: string;
  password: string;
};

type PelangganRow = {
  id_pelanggan: number;
  email: string;
  password: string;
  status_registrasi: "valid" | "pending";
};

type AdminRow = {
  id_admin: number;
  email: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<LoginPayload>;
    const email = (payload.email ?? "").trim().toLowerCase();
    const password = payload.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ message: "Email address and password are required." }, { status: 400 });
    }

    const pool = getDbPool();

    const [pelangganRows] = await pool.query(
      "SELECT id_pelanggan, email, password, status_registrasi FROM pelanggan WHERE email = ? LIMIT 1",
      [email]
    );
    const pelanggan = (pelangganRows as PelangganRow[])[0];

    if (pelanggan) {
      if (pelanggan.status_registrasi !== "valid") {
        return NextResponse.json({ message: "Your account has not been approved by an admin yet." }, { status: 403 });
      }
      const isValidPassword = await verifyPassword(password, pelanggan.password);
      if (!isValidPassword) {
        return NextResponse.json({ message: "Invalid email address or password." }, { status: 401 });
      }

      const response = NextResponse.json({
        message: "Login successful.",
        role: "pelanggan",
        redirectTo: "/",
      });
      response.cookies.set(AUTH_COOKIE_NAME, buildSessionValue(pelanggan.id_pelanggan, pelanggan.email, "pelanggan"), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return response;
    }

    const [adminRows] = await pool.query("SELECT id_admin, email, password FROM admin WHERE email = ? LIMIT 1", [email]);
    const admin = (adminRows as AdminRow[])[0];
    if (!admin) {
      return NextResponse.json({ message: "Invalid email address or password." }, { status: 401 });
    }

    const isValidAdminPassword = await verifyPassword(password, admin.password);
    if (!isValidAdminPassword) {
      return NextResponse.json({ message: "Invalid email address or password." }, { status: 401 });
    }

    const response = NextResponse.json({
      message: "Login successful.",
      role: "admin",
      redirectTo: "/admin",
    });
    response.cookies.set(AUTH_COOKIE_NAME, buildSessionValue(admin.id_admin, admin.email, "admin"), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    return NextResponse.json({ message: "A server error occurred during login." }, { status: 500 });
  }
}
