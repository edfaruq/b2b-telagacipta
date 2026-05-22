import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { fetchBuyerInvoice } from "@/lib/invoice-fetch";
import { generateInvoicePdfBuffer } from "@/lib/generate-invoice-pdf";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
  }

  const { id } = await context.params;
  const idInvoice = Number(id);
  if (!Number.isInteger(idInvoice) || idInvoice <= 0) {
    return NextResponse.json({ message: "Invalid invoice id." }, { status: 400 });
  }

  try {
    const invoice = await fetchBuyerInvoice(idInvoice, session.userId);
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
    }
    if (invoice.status !== "lunas") {
      return NextResponse.json(
        {
          message:
            "Invoice PDF is available after admin validates your payment.",
        },
        { status: 403 }
      );
    }

    const pdf = await generateInvoicePdfBuffer(invoice);
    const filename = `${invoice.number}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[invoice-pdf]", err);
    return NextResponse.json({ message: "Could not generate PDF." }, { status: 500 });
  }
}
