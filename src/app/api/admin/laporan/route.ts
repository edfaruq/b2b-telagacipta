import { NextResponse } from "next/server";
import { fetchAdminLaporan, parseLaporanParams } from "@/lib/fetch-admin-laporan";
import { getServerSession } from "@/lib/get-server-session";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const parsed = parseLaporanParams(new URL(request.url).searchParams);
  if (!parsed) {
    return NextResponse.json(
      { message: "Invalid params. Use ?year=YYYY&month=YYYY-MM." },
      { status: 400 }
    );
  }

  try {
    const data = await fetchAdminLaporan(parsed.chartYear, parsed.detailMonthKey);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin/laporan GET]", err);
    return NextResponse.json({ message: "Could not load report." }, { status: 500 });
  }
}
