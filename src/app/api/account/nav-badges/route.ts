import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT
         (SELECT COUNT(*)
          FROM permintaan pm
          LEFT JOIN penawaran pw ON pw.id_permintaan = pm.id_permintaan
          WHERE pm.id_pelanggan = ?
            AND (
              pm.status_permintaan = 'menunggu'
              OR (pm.status_permintaan = 'diproses' AND pw.status_penawaran = 'dikirim')
            )) AS pendingRequests,
         (SELECT COUNT(*)
          FROM invoice inv
          INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
          INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
          WHERE pm.id_pelanggan = ?
            AND inv.status_invoice = 'belum_bayar') AS unpaidQuotations`,
      [session.userId, session.userId]
    );

    const row = (rows as Array<{ pendingRequests: number; unpaidQuotations: number }>)[0];

    return NextResponse.json({
      pendingRequests: Number(row?.pendingRequests) || 0,
      unpaidQuotations: Number(row?.unpaidQuotations) || 0,
    });
  } catch {
    return NextResponse.json({ message: "Could not load navigation badges." }, { status: 500 });
  }
}
