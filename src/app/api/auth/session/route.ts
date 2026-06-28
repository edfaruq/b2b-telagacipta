import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionValue } from "@/lib/auth";
import { getDbPool } from "@/lib/db";
import { ensurePelangganSchema } from "@/lib/ensure-pelanggan-schema";
import { profileInitials } from "@/lib/profile-initials";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  if (session.role === "pelanggan") {
    try {
      const pool = getDbPool();
      await ensurePelangganSchema(pool);
      const [rows] = await pool.query(
        "SELECT nama, foto_profil FROM pelanggan WHERE id_pelanggan = ? LIMIT 1",
        [session.userId]
      );
      const row = (rows as Array<{ nama: string; foto_profil: string }>)[0];
      const name = row?.nama?.trim() || session.email.split("@")[0];
      const fotoProfil = row?.foto_profil?.trim() || "";

      return NextResponse.json({
        authenticated: true,
        email: session.email,
        role: session.role,
        name,
        foto_profil: fotoProfil,
        initials: profileInitials(name),
      });
    } catch {
      return NextResponse.json({
        authenticated: true,
        email: session.email,
        role: session.role,
        name: session.email.split("@")[0],
        foto_profil: "",
        initials: profileInitials(session.email.split("@")[0]),
      });
    }
  }

  return NextResponse.json({
    authenticated: true,
    email: session.email,
    role: session.role,
    name: session.email.split("@")[0],
    foto_profil: "",
    initials: profileInitials(session.email.split("@")[0]),
  });
}
