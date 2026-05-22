import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM permintaan WHERE status_permintaan = 'menunggu') AS pendingQuotationRequests,
         (SELECT COUNT(*) FROM pembayaran WHERE status_pembayaran = 'menunggu_validasi') AS pendingPayments,
         (SELECT COUNT(*) FROM pelanggan WHERE status_registrasi = 'pending') AS pendingUserApprovals`
    );

    const row = (
      rows as Array<{
        pendingQuotationRequests: number;
        pendingPayments: number;
        pendingUserApprovals: number;
      }>
    )[0];

    return NextResponse.json({
      pendingQuotationRequests: Number(row?.pendingQuotationRequests) || 0,
      pendingPayments: Number(row?.pendingPayments) || 0,
      pendingUserApprovals: Number(row?.pendingUserApprovals) || 0,
    });
  } catch {
    return NextResponse.json({ message: "Could not load navigation badges." }, { status: 500 });
  }
}
