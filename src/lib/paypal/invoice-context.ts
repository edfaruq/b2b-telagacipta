import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

export type InvoicePayContext = {
  id_invoice: number;
  nomor_invoice: string;
  total_invoice: number;
  status_invoice: string;
  id_pembayaran: number | null;
  status_pembayaran: string | null;
  metode_pembayaran: string | null;
  paypal_order_id: string | null;
};

export class InvoicePayError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = "InvoicePayError";
  }
}

export async function getInvoicePayContextForBuyer(
  session: SessionPayload,
  idInvoice: number
): Promise<InvoicePayContext> {
  if (session.role !== "pelanggan") {
    throw new InvoicePayError("Unauthorized.", 403);
  }

  const pool = getDbPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       inv.id_invoice,
       inv.nomor_invoice,
       inv.total_invoice,
       inv.status_invoice,
       pb.id_pembayaran,
       pb.status_pembayaran,
       pb.metode_pembayaran,
       pb.paypal_order_id
     FROM invoice inv
     INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
     INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
     LEFT JOIN pembayaran pb ON pb.id_invoice = inv.id_invoice
     WHERE inv.id_invoice = ? AND pm.id_pelanggan = ?
     LIMIT 1`,
    [idInvoice, session.userId]
  );

  const row = rows[0] as InvoicePayContext | undefined;
  if (!row) {
    throw new InvoicePayError("Invoice not found.", 404);
  }

  return {
    ...row,
    total_invoice: Number(row.total_invoice),
  };
}

export function assertInvoicePayable(ctx: InvoicePayContext): void {
  if (ctx.status_invoice === "lunas") {
    throw new InvoicePayError("This invoice is already paid.");
  }
  if (ctx.status_invoice === "dibatalkan") {
    throw new InvoicePayError("This invoice was cancelled.");
  }
  if (ctx.status_pembayaran === "valid") {
    throw new InvoicePayError("Payment already validated.");
  }
  if (
    ctx.status_pembayaran === "menunggu_validasi" &&
    ctx.metode_pembayaran !== "paypal"
  ) {
    throw new InvoicePayError(
      "Bank transfer proof is awaiting admin validation. Use PayPal after rejection or wait for review."
    );
  }
}
