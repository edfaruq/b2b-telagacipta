import type { PoolConnection } from "mysql2/promise";
import { getDbPool } from "@/lib/db";
import { ensurePengirimanForInvoice } from "@/lib/ensure-pengiriman";
import { generateUniqueReceiptNumber } from "@/lib/receipt-number";

export async function recordPayPalCapture(params: {
  idInvoice: number;
  paypalOrderId: string;
  paypalTransactionId: string;
  existingPaymentId: number | null;
}): Promise<{ id_pembayaran: number; nomor_receipt: string }> {
  const pool = getDbPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [invRows] = await conn.query(
      `SELECT id_invoice, status_invoice FROM invoice WHERE id_invoice = ? FOR UPDATE`,
      [params.idInvoice]
    );
    const inv = (invRows as Array<{ id_invoice: number; status_invoice: string }>)[0];
    if (!inv) {
      throw new Error("Invoice not found.");
    }
    if (inv.status_invoice === "lunas") {
      throw new Error("Invoice already paid.");
    }
    if (inv.status_invoice === "dibatalkan") {
      throw new Error("Invoice cancelled.");
    }

    const nomorReceipt = await generateUniqueReceiptNumber(conn);

    if (params.existingPaymentId) {
      const [upd] = await conn.query(
        `UPDATE pembayaran
         SET metode_pembayaran = 'paypal',
             paypal_order_id = ?,
             paypal_transaction_id = ?,
             bukti_pembayaran = NULL,
             status_pembayaran = 'valid',
             id_admin = NULL,
             nomor_receipt = ?,
             tanggal_validasi = NOW(),
             tanggal_pembayaran = NOW()
         WHERE id_pembayaran = ? AND status_pembayaran != 'valid'`,
        [
          params.paypalOrderId,
          params.paypalTransactionId,
          nomorReceipt,
          params.existingPaymentId,
        ]
      );
      if ((upd as { affectedRows: number }).affectedRows === 0) {
        const [again] = await conn.query(
          `SELECT id_pembayaran, nomor_receipt, paypal_transaction_id
           FROM pembayaran WHERE id_invoice = ? AND status_pembayaran = 'valid' LIMIT 1`,
          [params.idInvoice]
        );
        const paid = (
          again as Array<{ id_pembayaran: number; nomor_receipt: string | null }>
        )[0];
        if (paid?.nomor_receipt) {
          await conn.commit();
          return { id_pembayaran: paid.id_pembayaran, nomor_receipt: paid.nomor_receipt };
        }
        throw new Error("Payment could not be recorded.");
      }
    } else {
      const [ins] = await conn.query(
        `INSERT INTO pembayaran (
           id_invoice, id_admin, bukti_pembayaran, status_pembayaran,
           metode_pembayaran, paypal_order_id, paypal_transaction_id,
           nomor_receipt, tanggal_validasi
         ) VALUES (?, NULL, NULL, 'valid', 'paypal', ?, ?, ?, NOW())`,
        [
          params.idInvoice,
          params.paypalOrderId,
          params.paypalTransactionId,
          nomorReceipt,
        ]
      );
      params.existingPaymentId = Number((ins as { insertId: number }).insertId);
    }

    const [updInv] = await conn.query(
      `UPDATE invoice SET status_invoice = 'lunas'
       WHERE id_invoice = ? AND status_invoice = 'belum_bayar'`,
      [params.idInvoice]
    );
    if ((updInv as { affectedRows: number }).affectedRows === 0) {
      throw new Error("Invoice could not be marked as paid.");
    }

    await ensurePengirimanForInvoice(params.idInvoice, null, conn);

    await conn.commit();

    return {
      id_pembayaran: params.existingPaymentId!,
      nomor_receipt: nomorReceipt,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
