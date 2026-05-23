import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { capturePayPalOrder, extractCaptureFromOrder } from "@/lib/paypal/client";
import { captureMatchesInvoiceTotal, isPayPalConfigured } from "@/lib/paypal/config";
import {
  assertInvoicePayable,
  getInvoicePayContextForBuyer,
  InvoicePayError,
} from "@/lib/paypal/invoice-context";
import { recordPayPalCapture } from "@/lib/paypal/record-payment";

type RouteContext = { params: Promise<{ id: string }> };

type Body = { orderId?: string };

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }

  if (!isPayPalConfigured()) {
    return NextResponse.json({ message: "PayPal is not configured." }, { status: 503 });
  }

  const { id } = await context.params;
  const idInvoice = Number(id);
  if (!Number.isInteger(idInvoice) || idInvoice <= 0) {
    return NextResponse.json({ message: "Invalid invoice id." }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const orderId = (body.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ message: "PayPal order id is required." }, { status: 400 });
  }

  try {
    const ctx = await getInvoicePayContextForBuyer(session, idInvoice);

    const pool = getDbPool();
    const [paidRows] = await pool.query(
      `SELECT id_pembayaran, nomor_receipt, paypal_transaction_id
       FROM pembayaran
       WHERE id_invoice = ? AND status_pembayaran = 'valid' AND metode_pembayaran = 'paypal'
       LIMIT 1`,
      [idInvoice]
    );
    const alreadyPaid = (
      paidRows as Array<{
        id_pembayaran: number;
        nomor_receipt: string | null;
        paypal_transaction_id: string | null;
      }>
    )[0];
    if (alreadyPaid?.paypal_transaction_id) {
      return NextResponse.json({
        message: "Invoice already paid with PayPal.",
        receiptNumber: alreadyPaid.nomor_receipt,
        transactionId: alreadyPaid.paypal_transaction_id,
      });
    }

    if (ctx.status_invoice !== "lunas") {
      assertInvoicePayable(ctx);
    }

    const capture = await capturePayPalOrder(orderId);
    const parsed = extractCaptureFromOrder(capture);
    if (!parsed) {
      return NextResponse.json({ message: "PayPal payment was not completed." }, { status: 402 });
    }

    if (parsed.invoiceId !== idInvoice) {
      return NextResponse.json({ message: "PayPal order is for a different invoice." }, { status: 400 });
    }

    if (!captureMatchesInvoiceTotal(ctx.total_invoice, parsed.amount)) {
      return NextResponse.json({ message: "PayPal amount does not match invoice total." }, { status: 400 });
    }

    const result = await recordPayPalCapture({
      idInvoice,
      paypalOrderId: parsed.orderId,
      paypalTransactionId: parsed.captureId,
      existingPaymentId: ctx.id_pembayaran,
    });

    return NextResponse.json({
      message: "Payment successful. Invoice is paid; you can download the invoice PDF.",
      transactionId: parsed.captureId,
      orderId: parsed.orderId,
      receiptNumber: result.nomor_receipt,
    });
  } catch (err) {
    if (err instanceof InvoicePayError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Could not capture PayPal payment.";
    console.error("[paypal/capture]", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
