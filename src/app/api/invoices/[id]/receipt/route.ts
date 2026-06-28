import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { INVOICE_COMPANY } from "@/lib/invoice-company";
import { ensurePaymentReceipt } from "@/lib/ensure-payment-receipt";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { paymentMethodDetail, paymentMethodLabel } from "@/lib/payment-method";

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
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT
         inv.nomor_invoice,
         inv.total_invoice,
         inv.status_invoice,
         pb.id_pembayaran,
         pb.nomor_receipt,
         pb.tanggal_validasi,
         pb.status_pembayaran,
         pb.metode_pembayaran
       FROM invoice inv
       INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
       INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
       LEFT JOIN pembayaran pb ON pb.id_invoice = inv.id_invoice
       WHERE inv.id_invoice = ? AND pm.id_pelanggan = ?
       LIMIT 1`,
      [idInvoice, session.userId]
    );

    const row = (
      rows as Array<{
        nomor_invoice: string;
        total_invoice: string | number;
        status_invoice: string;
        id_pembayaran: number | null;
        nomor_receipt: string | null;
        tanggal_validasi: string | Date | null;
        status_pembayaran: string | null;
        metode_pembayaran: string | null;
      }>
    )[0];

    if (!row) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
    }
    if (row.status_invoice !== "lunas" || row.status_pembayaran !== "valid") {
      return NextResponse.json(
        { message: "Receipt is available after your payment is validated." },
        { status: 403 }
      );
    }
    if (!row.id_pembayaran) {
      return NextResponse.json({ message: "Payment record not found." }, { status: 404 });
    }

    let nomorReceipt = row.nomor_receipt;
    let paidAt =
      row.tanggal_validasi instanceof Date
        ? row.tanggal_validasi.toISOString()
        : row.tanggal_validasi
          ? String(row.tanggal_validasi)
          : new Date().toISOString();

    if (!nomorReceipt) {
      const ensured = await ensurePaymentReceipt(row.id_pembayaran);
      if (!ensured) {
        return NextResponse.json({ message: "Could not issue receipt for this payment." }, { status: 500 });
      }
      nomorReceipt = ensured.nomor_receipt;
      paidAt = ensured.tanggal_validasi;
    }

    const total = Number(row.total_invoice) || 0;

    return NextResponse.json({
      receipt: {
        id: row.id_pembayaran,
        sellerName: INVOICE_COMPANY.name,
        amountLabel: formatPriceIdr(total),
        paidAt,
        paidAtLabel: new Date(paidAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        receiptNumber: nomorReceipt,
        invoiceNumber: row.nomor_invoice,
        paymentMethod: paymentMethodLabel(row.metode_pembayaran),
        accountDisplay: paymentMethodDetail(row.metode_pembayaran),
      },
    });
  } catch (err) {
    console.error("[invoice-receipt]", err);
    return NextResponse.json({ message: "Could not load receipt." }, { status: 500 });
  }
}
