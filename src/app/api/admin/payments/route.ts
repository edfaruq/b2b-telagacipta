import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { paymentStatusLabel } from "@/lib/payment-status";
import { generateUniqueReceiptNumber } from "@/lib/receipt-number";

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT
         pb.id_pembayaran,
         pb.id_invoice,
         pb.bukti_pembayaran,
         pb.tanggal_pembayaran,
         pb.status_pembayaran,
         pb.catatan_validasi,
         inv.nomor_invoice,
         inv.total_invoice,
         inv.status_invoice,
         pl.nama,
         pl.email,
         pl.instansi,
         p.nama_produk
       FROM pembayaran pb
       INNER JOIN invoice inv ON inv.id_invoice = pb.id_invoice
       INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
       INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
       INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
       INNER JOIN produk p ON p.id_produk = pm.id_produk
       WHERE pb.status_pembayaran = 'menunggu_validasi'
       ORDER BY pb.tanggal_pembayaran ASC`
    );

    const payments = (
      rows as Array<{
        id_pembayaran: number;
        id_invoice: number;
        bukti_pembayaran: string;
        tanggal_pembayaran: string | Date;
        status_pembayaran: string;
        nomor_invoice: string;
        total_invoice: string | number;
        nama: string;
        email: string;
        instansi: string;
        nama_produk: string;
      }>
    ).map((row) => {
      const tanggal =
        row.tanggal_pembayaran instanceof Date
          ? row.tanggal_pembayaran.toISOString()
          : String(row.tanggal_pembayaran);
      return {
        id_pembayaran: row.id_pembayaran,
        id_invoice: row.id_invoice,
        proofUrl: row.bukti_pembayaran,
        submittedAt: tanggal,
        status: row.status_pembayaran,
        statusLabel: paymentStatusLabel(row.status_pembayaran),
        invoiceNumber: row.nomor_invoice,
        totalLabel: formatPriceIdr(Number(row.total_invoice) || 0),
        buyerName: row.nama,
        buyerEmail: row.email,
        institution: row.instansi,
        productName: row.nama_produk,
      };
    });

    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ message: "Could not load payments." }, { status: 500 });
  }
}

type PatchBody = {
  id_pembayaran?: number;
  action?: "approve" | "reject";
  note?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const idPembayaran = Number(body.id_pembayaran);
  const action = body.action === "reject" ? "reject" : body.action === "approve" ? "approve" : null;
  const note = (body.note ?? "").trim() || null;

  if (!Number.isInteger(idPembayaran) || idPembayaran <= 0) {
    return NextResponse.json({ message: "Invalid payment id." }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ message: "Action must be approve or reject." }, { status: 400 });
  }

  const nextPayment = action === "approve" ? "valid" : "ditolak";

  try {
    const pool = getDbPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [payRows] = await conn.query(
        `SELECT id_pembayaran, id_invoice, status_pembayaran
         FROM pembayaran WHERE id_pembayaran = ? LIMIT 1`,
        [idPembayaran]
      );
      const pay = (payRows as Array<{ id_pembayaran: number; id_invoice: number; status_pembayaran: string }>)[0];
      if (!pay) {
        await conn.rollback();
        return NextResponse.json({ message: "Payment not found." }, { status: 404 });
      }
      if (pay.status_pembayaran !== "menunggu_validasi") {
        await conn.rollback();
        return NextResponse.json({ message: "Payment already processed." }, { status: 400 });
      }

      if (action === "approve") {
        const nomorReceipt = await generateUniqueReceiptNumber(conn);
        const [updPay] = await conn.query(
          `UPDATE pembayaran
           SET status_pembayaran = 'valid', id_admin = ?, catatan_validasi = ?,
               nomor_receipt = ?, tanggal_validasi = NOW()
           WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu_validasi'`,
          [session.userId, note, nomorReceipt, idPembayaran]
        );
        if ((updPay as { affectedRows: number }).affectedRows === 0) {
          await conn.rollback();
          return NextResponse.json({ message: "Payment could not be updated." }, { status: 409 });
        }

        const [updInv] = await conn.query(
          `UPDATE invoice SET status_invoice = 'lunas'
           WHERE id_invoice = ? AND status_invoice = 'belum_bayar'`,
          [pay.id_invoice]
        );
        if ((updInv as { affectedRows: number }).affectedRows === 0) {
          await conn.rollback();
          return NextResponse.json({ message: "Invoice could not be marked as paid." }, { status: 409 });
        }
      } else {
        const [updPay] = await conn.query(
          `UPDATE pembayaran
           SET status_pembayaran = 'ditolak', id_admin = ?, catatan_validasi = ?
           WHERE id_pembayaran = ? AND status_pembayaran = 'menunggu_validasi'`,
          [session.userId, note, idPembayaran]
        );
        if ((updPay as { affectedRows: number }).affectedRows === 0) {
          await conn.rollback();
          return NextResponse.json({ message: "Payment could not be updated." }, { status: 409 });
        }
      }

      await conn.commit();

      return NextResponse.json({
        message:
          action === "approve"
            ? "Payment validated. Receipt issued; customer can download invoice PDF."
            : "Payment rejected. Customer may submit proof again.",
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch {
    return NextResponse.json({ message: "Could not update payment." }, { status: 500 });
  }
}
