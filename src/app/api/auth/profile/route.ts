import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ensurePelangganSchema } from "@/lib/ensure-pelanggan-schema";

type PelangganProfileRow = {
  nama: string;
  email: string;
  instansi: string;
  no_telepon: string;
  alamat: string;
  negara: string;
  foto_profil: string;
};

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json({ message: "Buyer account required." }, { status: 403 });
  }

  try {
    const pool = getDbPool();
    await ensurePelangganSchema(pool);
    const [rows] = await pool.query(
      "SELECT nama, email, instansi, no_telepon, alamat, negara, foto_profil FROM pelanggan WHERE id_pelanggan = ? LIMIT 1",
      [session.userId]
    );
    const profile = (rows as PelangganProfileRow[])[0];
    if (!profile) {
      return NextResponse.json({ message: "Profile not found." }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json({ message: "Buyer account required." }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as {
      alamat?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const pool = getDbPool();

    if (payload.alamat !== undefined) {
      const alamat = payload.alamat.trim();
      if (!alamat) {
        return NextResponse.json({ message: "Address is required." }, { status: 400 });
      }
      if (alamat.length > 255) {
        return NextResponse.json({ message: "Address must be at most 255 characters." }, { status: 400 });
      }

      await pool.query("UPDATE pelanggan SET alamat = ? WHERE id_pelanggan = ?", [
        alamat,
        session.userId,
      ]);

      return NextResponse.json({ message: "Address updated.", profile: { alamat } });
    }

    const currentPassword = payload.currentPassword ?? "";
    const newPassword = payload.newPassword ?? "";
    const confirmPassword = payload.confirmPassword ?? "";

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { message: "Current password, new password, and confirmation are required." },
          { status: 400 }
        );
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ message: "New password and confirmation do not match." }, { status: 400 });
      }
      if (!PASSWORD_RULE.test(newPassword)) {
        return NextResponse.json(
          {
            message:
              "Password must be at least 8 characters and include uppercase, lowercase, and a special character.",
          },
          { status: 400 }
        );
      }

      const [rows] = await pool.query(
        "SELECT password FROM pelanggan WHERE id_pelanggan = ? LIMIT 1",
        [session.userId]
      );
      const row = (rows as Array<{ password: string }>)[0];
      if (!row) {
        return NextResponse.json({ message: "Profile not found." }, { status: 404 });
      }

      const valid = await verifyPassword(currentPassword, row.password);
      if (!valid) {
        return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 });
      }

      const hashed = await hashPassword(newPassword);
      await pool.query("UPDATE pelanggan SET password = ? WHERE id_pelanggan = ?", [
        hashed,
        session.userId,
      ]);

      return NextResponse.json({ message: "Password updated successfully." });
    }

    return NextResponse.json({ message: "No changes submitted." }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
