import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { createPayPalOrder } from "@/lib/paypal/client";
import { isPayPalConfigured } from "@/lib/paypal/config";
import {
  assertInvoicePayable,
  getInvoicePayContextForBuyer,
  InvoicePayError,
} from "@/lib/paypal/invoice-context";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
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

  try {
    const ctx = await getInvoicePayContextForBuyer(session, idInvoice);
    assertInvoicePayable(ctx);

    const order = await createPayPalOrder({
      invoiceId: ctx.id_invoice,
      invoiceNumber: ctx.nomor_invoice,
      totalIdr: ctx.total_invoice,
    });

    if (!order.id) {
      return NextResponse.json({ message: "PayPal did not return an order id." }, { status: 502 });
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    if (err instanceof InvoicePayError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Could not create PayPal order.";
    console.error("[paypal/create-order]", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
