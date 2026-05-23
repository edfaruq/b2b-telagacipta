import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";
import { getServerSession } from "@/lib/get-server-session";
import {
  MAX_ORDER_FEEDBACK_LENGTH,
  normalizeOrderFeedback,
  parseOrderRating,
} from "@/lib/order-feedback";

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

  let body: { rating?: unknown; feedback?: unknown } = {};
  try {
    body = (await request.json()) as { rating?: unknown; feedback?: unknown };
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const rating = parseOrderRating(body.rating);
  if (rating === null) {
    return NextResponse.json(
      { message: "Please select a rating from 1 to 5 stars." },
      { status: 400 }
    );
  }

  const feedback = normalizeOrderFeedback(body.feedback);
  if (feedback.length > MAX_ORDER_FEEDBACK_LENGTH) {
    return NextResponse.json(
      { message: `Feedback must be at most ${MAX_ORDER_FEEDBACK_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool();
    await ensurePengirimanSchema(pool);
    const params = [rating, feedback || null, idInvoice, session.userId];

    const [shipped] = await pool.query(
      `UPDATE pengiriman pg
       INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
       INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
       INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
       SET pg.status_pengiriman = 'diterima',
           pg.tanggal_diterima = NOW(),
           pg.rating = ?,
           pg.feedback = ?
       WHERE pg.id_invoice = ?
         AND pm.id_pelanggan = ?
         AND inv.status_invoice = 'lunas'
         AND pg.status_pengiriman = 'dikirim'`,
      params
    );

    if ((shipped as { affectedRows: number }).affectedRows > 0) {
      return NextResponse.json({
        message: "Thank you! Your delivery is confirmed and your feedback was saved.",
      });
    }

    const [rated] = await pool.query(
      `UPDATE pengiriman pg
       INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
       INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
       INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
       SET pg.rating = ?,
           pg.feedback = ?
       WHERE pg.id_invoice = ?
         AND pm.id_pelanggan = ?
         AND inv.status_invoice = 'lunas'
         AND pg.status_pengiriman = 'diterima'
         AND (pg.rating IS NULL OR pg.rating < 1)`,
      params
    );

    if ((rated as { affectedRows: number }).affectedRows > 0) {
      return NextResponse.json({
        message: "Thank you! Your rating and feedback were saved.",
      });
    }

    return NextResponse.json(
      {
        message:
          "Order is not ready for confirmation, or you have already submitted a rating.",
      },
      { status: 400 }
    );
  } catch (err) {
    console.error("[shipping/confirm]", err);
    return NextResponse.json({ message: "Could not confirm delivery." }, { status: 500 });
  }
}
