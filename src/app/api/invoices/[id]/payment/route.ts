import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { savePaymentProof } from "@/lib/payment-upload";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Payment proof file is required." }, { status: 400 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT inv.id_invoice, inv.status_invoice, pb.id_pembayaran, pb.status_pembayaran
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
        id_invoice: number;
        status_invoice: string;
        id_pembayaran: number | null;
        status_pembayaran: string | null;
      }>
    )[0];

    if (!row) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 });
    }
    if (row.status_invoice === "lunas") {
      return NextResponse.json({ message: "This invoice is already paid." }, { status: 400 });
    }
    if (row.status_invoice === "dibatalkan") {
      return NextResponse.json({ message: "This invoice was cancelled." }, { status: 400 });
    }
    if (row.status_pembayaran === "menunggu_validasi") {
      return NextResponse.json(
        { message: "Payment proof is already awaiting admin validation." },
        { status: 400 }
      );
    }
    if (row.status_pembayaran === "valid") {
      return NextResponse.json({ message: "Payment already validated." }, { status: 400 });
    }

    const saved = await savePaymentProof(idInvoice, file);
    if ("error" in saved) {
      return NextResponse.json({ message: saved.error }, { status: 400 });
    }

    if (row.id_pembayaran) {
      await pool.query(
        `UPDATE pembayaran
         SET bukti_pembayaran = ?, status_pembayaran = 'menunggu_validasi',
             tanggal_pembayaran = NOW(), id_admin = NULL,
             nomor_receipt = NULL, tanggal_validasi = NULL
         WHERE id_pembayaran = ?`,
        [saved.publicPath, row.id_pembayaran]
      );
    } else {
      await pool.query(
        `INSERT INTO pembayaran (id_invoice, id_admin, bukti_pembayaran, status_pembayaran)
         VALUES (?, NULL, ?, 'menunggu_validasi')`,
        [idInvoice, saved.publicPath]
      );
    }

    return NextResponse.json({
      message: "Payment proof submitted. We will validate your payment shortly.",
    });
  } catch {
    return NextResponse.json({ message: "Could not submit payment." }, { status: 500 });
  }
}
