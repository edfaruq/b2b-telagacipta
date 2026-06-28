import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { fetchBuyerInvoice } from "@/lib/invoice-fetch";
import { invoiceNumberLabel } from "@/lib/invoice-number";
import { invoiceStatusLabel } from "@/lib/invoice-status";
import { paymentRejectedMessage, paymentStatusLabel } from "@/lib/payment-status";

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
    const row = await fetchBuyerInvoice(idInvoice, session.userId);
    if (!row) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
    }

    const canDownloadPdf = row.status === "lunas";
    const paymentStatus = row.payment?.status ?? null;
    const canPay =
      row.status === "belum_bayar" &&
      (paymentStatus === null || paymentStatus === "ditolak");

    const hasReceipt =
      row.status === "lunas" && paymentStatus === "valid" && Boolean(row.payment?.id);

    return NextResponse.json({
      invoice: {
        id: row.id,
        number: row.number,
        numberLabel: invoiceNumberLabel(row.number),
        issuedAt: row.issuedAt,
        issuedAtLabel: new Date(row.issuedAt).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        }),
        dueAtLabel: new Date(row.dueAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        totalLabel: row.totalLabel,
        status: row.status,
        statusLabel: invoiceStatusLabel(row.status),
        requestIdLabel: row.requestIdLabel,
        buyer: row.buyer,
        billToLines: row.billToLines,
        productName: row.productName,
        quantity: row.quantity,
        unit: row.unit,
        lines: row.lines,
        paymentMethodLabel: row.paymentMethodLabel,
        payment: row.payment
          ? {
              status: row.payment.status,
              statusLabel: paymentStatusLabel(row.payment.status ?? ""),
              proofUrl: row.payment.proofUrl,
            }
          : null,
        canPay,
        canDownloadPdf,
        hasReceipt,
        paymentPending: paymentStatus === "menunggu_validasi",
        paymentRejected: paymentStatus === "ditolak",
        paymentRejectedMessage:
          paymentStatus === "ditolak" ? paymentRejectedMessage() : null,
      },
    });
  } catch {
    return NextResponse.json({ message: "Could not load invoice." }, { status: 500 });
  }
}
