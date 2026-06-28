import { NextResponse } from "next/server";
import { fetchAdminLaporan, parseLaporanParams } from "@/lib/fetch-admin-laporan";
import { generateReportPdfBuffer } from "@/lib/generate-report-pdf";
import { getServerSession } from "@/lib/get-server-session";

export const runtime = "nodejs";

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
    const report = await fetchAdminLaporan(parsed.chartYear, parsed.detailMonthKey);
    const pdf = await generateReportPdfBuffer(report);
    const filename = `transaction-report-${report.month}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[admin/laporan/pdf GET]", err);
    return NextResponse.json({ message: "Could not generate PDF." }, { status: 500 });
  }
}
