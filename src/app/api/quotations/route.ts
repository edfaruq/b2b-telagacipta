import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { generateUniqueInvoiceNumber } from "@/lib/invoice-number";
import { formatPenawaranFields, penawaranStatusLabel } from "@/lib/penawaran";
import { PERMINTAAN_STATUS_DEFAULT } from "@/lib/permintaan-status";

type QuotationRow = {
  id_permintaan: number;
  jumlah_permintaan: string | number;
  detail_permintaan: string | null;
  alamat_tujuan: string;
  status_permintaan: string;
  tanggal_permintaan: string | Date;
  nama_produk: string;
  slug: string;
  satuan: string;
  harga_indikatif: string | number;
  foto_produk: string;
  request_sequence: string | number;
  id_penawaran: number | null;
  harga_ton: string | number | null;
  biaya_pengiriman: string | number | null;
  ekspedisi: string | null;
  total_penawaran: string | number | null;
  tanggal_penawaran: string | Date | null;
  status_penawaran: string | null;
};

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in to view quotations." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json(
      { message: "Quotations are only available for buyer accounts." },
      { status: 403 }
    );
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT
         pm.id_permintaan,
         pm.jumlah_permintaan,
         pm.detail_permintaan,
         pm.alamat_tujuan,
         pm.status_permintaan,
         pm.tanggal_permintaan,
         p.nama_produk,
         p.slug,
         p.satuan,
         p.harga_indikatif,
         p.foto_produk,
         (SELECT COUNT(*)
          FROM permintaan x
          WHERE x.id_pelanggan = pm.id_pelanggan
            AND x.id_permintaan <= pm.id_permintaan) AS request_sequence,
         pw.id_penawaran,
         pw.harga_ton,
         pw.biaya_pengiriman,
         pw.ekspedisi,
         pw.total_penawaran,
         pw.tanggal_penawaran,
         pw.status_penawaran
       FROM permintaan pm
       INNER JOIN produk p ON p.id_produk = pm.id_produk
       LEFT JOIN penawaran pw ON pw.id_permintaan = pm.id_permintaan
       WHERE pm.id_pelanggan = ?
         AND pm.status_permintaan != 'disetujui'
       ORDER BY pm.tanggal_permintaan DESC`,
      [session.userId]
    );

    const quotations = (rows as QuotationRow[]).map((row) => {
      const qty = Number(row.jumlah_permintaan) || 0;
      const unitPrice =
        typeof row.harga_indikatif === "string"
          ? Number(row.harga_indikatif)
          : Number(row.harga_indikatif);
      const safeUnit = Number.isFinite(unitPrice) ? unitPrice : 0;
      const satuan = (row.satuan || "kg").trim();
      const tanggal =
        row.tanggal_permintaan instanceof Date
          ? row.tanggal_permintaan.toISOString()
          : String(row.tanggal_permintaan);

      let offer: {
        id: number;
        unitPrice: number;
        unitPriceLabel: string;
        shippingLabel: string;
        expedition: string;
        subtotalLabel: string;
        totalLabel: string;
        status: string;
        statusLabel: string;
        sentAt: string;
        canRespond: boolean;
      } | null = null;

      if (row.id_penawaran != null) {
        const hargaTon = Number(row.harga_ton) || 0;
        const biaya = Number(row.biaya_pengiriman) || 0;
        const total = Number(row.total_penawaran) || 0;
        const offerStatus = row.status_penawaran ?? "dikirim";
        const sentAt =
          row.tanggal_penawaran instanceof Date
            ? row.tanggal_penawaran.toISOString()
            : row.tanggal_penawaran
              ? String(row.tanggal_penawaran)
              : tanggal;
        const formatted = formatPenawaranFields(hargaTon, qty, biaya, total, satuan);

        offer = {
          id: row.id_penawaran,
          unitPrice: hargaTon,
          unitPriceLabel: formatted.hargaPerUnitLabel,
          shippingLabel: formatted.biayaPengirimanLabel,
          expedition: (row.ekspedisi ?? "").trim(),
          subtotalLabel: formatted.subtotalLabel,
          totalLabel: formatted.totalPenawaranLabel,
          status: offerStatus,
          statusLabel: penawaranStatusLabel(offerStatus),
          sentAt,
          canRespond:
            row.status_permintaan === "diproses" && offerStatus === "dikirim",
        };
      }

      return {
        id: row.id_permintaan,
        requestSequence: Number(row.request_sequence) || 1,
        productName: row.nama_produk,
        productSlug: row.slug,
        productImage: row.foto_produk?.trim() || "/images/logo-telagacipta.png",
        quantity: qty,
        unit: satuan,
        unitPriceLabel: formatPriceIdr(safeUnit),
        estimatedTotalLabel: formatPriceIdr(safeUnit * qty),
        deliveryAddress: row.alamat_tujuan,
        notes: row.detail_permintaan ?? "",
        status: row.status_permintaan,
        requestedAt: tanggal,
        offer,
      };
    });

    return NextResponse.json({ quotations });
  } catch {
    return NextResponse.json({ message: "Could not load quotations." }, { status: 500 });
  }
}

type QuotationBody = {
  slug?: string;
  quantity?: number | string;
  deliveryAddress?: string;
  notes?: string;
};

type ProdukIdRow = { id_produk: number; stok: number; nama_produk: string };

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in to request a quotation." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json(
      { message: "Quotation requests are only available for buyer accounts." },
      { status: 403 }
    );
  }

  let body: QuotationBody;
  try {
    body = (await request.json()) as QuotationBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim();
  const deliveryAddress = (body.deliveryAddress ?? "").trim();
  const notes = (body.notes ?? "").trim();
  const parsedQty =
    typeof body.quantity === "string" ? Number.parseFloat(body.quantity) : Number(body.quantity ?? NaN);
  const quantity = Number.isFinite(parsedQty) ? parsedQty : NaN;

  if (!slug) {
    return NextResponse.json({ message: "Product is required." }, { status: 400 });
  }
  if (!deliveryAddress) {
    return NextResponse.json({ message: "Delivery address is required." }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ message: "Quantity must be greater than 0." }, { status: 400 });
  }

  try {
    const pool = getDbPool();
    const [productRows] = await pool.query(
      "SELECT id_produk, stok, nama_produk FROM produk WHERE slug = ? AND status = 'active' LIMIT 1",
      [slug]
    );
    const product = (productRows as ProdukIdRow[])[0];
    if (!product) {
      return NextResponse.json({ message: "Product not found or unavailable." }, { status: 404 });
    }

    const stock = Number(product.stok) || 0;
    if (quantity > stock) {
      return NextResponse.json(
        { message: `Quantity exceeds available stock (${stock}).` },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO permintaan (
         id_pelanggan, id_produk, jumlah_permintaan, detail_permintaan,
         alamat_tujuan, status_permintaan
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session.userId,
        product.id_produk,
        quantity,
        notes || null,
        deliveryAddress,
        PERMINTAAN_STATUS_DEFAULT,
      ]
    );

    const insertId = (result as { insertId?: number }).insertId;

    return NextResponse.json({
      ok: true,
      message: "Quotation request submitted successfully. Our team will contact you soon.",
      id_permintaan: insertId,
      productName: product.nama_produk,
    });
  } catch {
    return NextResponse.json({ message: "Could not save quotation request." }, { status: 500 });
  }
}

type RespondBody = {
  id_permintaan?: number;
  action?: "accept" | "reject";
};

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }
  if (session.role !== "pelanggan") {
    return NextResponse.json({ message: "Only buyer accounts can respond to quotations." }, { status: 403 });
  }

  let body: RespondBody;
  try {
    body = (await request.json()) as RespondBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const idPermintaan = Number(body.id_permintaan);
  const action = body.action === "reject" ? "reject" : body.action === "accept" ? "accept" : null;

  if (!Number.isInteger(idPermintaan) || idPermintaan <= 0) {
    return NextResponse.json({ message: "Invalid request id." }, { status: 400 });
  }
  if (!action) {
    return NextResponse.json({ message: "Action must be accept or reject." }, { status: 400 });
  }

  const nextPermintaan = action === "accept" ? "disetujui" : "ditolak";
  const nextPenawaran = action === "accept" ? "disetujui" : "ditolak";

  try {
    const pool = getDbPool();

    const [rows] = await pool.query(
      `SELECT pm.id_permintaan, pm.status_permintaan,
              pw.id_penawaran, pw.status_penawaran, pw.total_penawaran
       FROM permintaan pm
       LEFT JOIN penawaran pw ON pw.id_permintaan = pm.id_permintaan
       WHERE pm.id_permintaan = ? AND pm.id_pelanggan = ?
       LIMIT 1`,
      [idPermintaan, session.userId]
    );

    const row = (
      rows as Array<{
        id_permintaan: number;
        status_permintaan: string;
        id_penawaran: number | null;
        status_penawaran: string | null;
        total_penawaran: string | number | null;
      }>
    )[0];

    if (!row) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }
    if (row.status_permintaan !== "diproses" || !row.id_penawaran) {
      return NextResponse.json(
        { message: "No quotation is available to respond to for this request." },
        { status: 400 }
      );
    }
    if (row.status_penawaran !== "dikirim") {
      return NextResponse.json(
        { message: "You have already responded to this quotation." },
        { status: 400 }
      );
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [penResult] = await conn.query(
        `UPDATE penawaran SET status_penawaran = ?
         WHERE id_penawaran = ? AND status_penawaran = 'dikirim'`,
        [nextPenawaran, row.id_penawaran]
      );
      if ((penResult as { affectedRows: number }).affectedRows === 0) {
        await conn.rollback();
        return NextResponse.json(
          { message: "Quotation could not be updated." },
          { status: 409 }
        );
      }

      const [permResult] = await conn.query(
        `UPDATE permintaan SET status_permintaan = ?
         WHERE id_permintaan = ? AND id_pelanggan = ? AND status_permintaan = 'diproses'`,
        [nextPermintaan, idPermintaan, session.userId]
      );
      if ((permResult as { affectedRows: number }).affectedRows === 0) {
        await conn.rollback();
        return NextResponse.json({ message: "Request could not be updated." }, { status: 409 });
      }

      let invoicePayload: {
        id_invoice: number;
        nomor_invoice: string;
      } | null = null;

      if (action === "accept" && row.id_penawaran) {
        const totalInvoice = Number(row.total_penawaran) || 0;
        if (totalInvoice <= 0) {
          await conn.rollback();
          return NextResponse.json(
            { message: "Invalid quotation total; cannot generate invoice." },
            { status: 400 }
          );
        }

        const [existingInv] = await conn.query(
          "SELECT id_invoice, nomor_invoice FROM invoice WHERE id_penawaran = ? LIMIT 1",
          [row.id_penawaran]
        );
        const existing = (existingInv as Array<{ id_invoice: number; nomor_invoice: string }>)[0];

        if (existing) {
          invoicePayload = {
            id_invoice: existing.id_invoice,
            nomor_invoice: existing.nomor_invoice,
          };
        } else {
          const nomorInvoice = await generateUniqueInvoiceNumber(conn);
          const [invResult] = await conn.query(
            `INSERT INTO invoice (id_penawaran, nomor_invoice, total_invoice, status_invoice)
             VALUES (?, ?, ?, 'belum_bayar')`,
            [row.id_penawaran, nomorInvoice, totalInvoice]
          );
          const insertId = (invResult as { insertId?: number }).insertId;
          if (!insertId) {
            await conn.rollback();
            return NextResponse.json({ message: "Could not generate invoice." }, { status: 500 });
          }
          invoicePayload = { id_invoice: insertId, nomor_invoice: nomorInvoice };
        }
      }

      await conn.commit();

      return NextResponse.json({
        message:
          action === "accept"
            ? "Quotation accepted. Your invoice has been generated."
            : "Quotation declined. You may submit a new request anytime.",
        status: nextPermintaan,
        invoice: invoicePayload,
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch {
    return NextResponse.json({ message: "Could not update quotation response." }, { status: 500 });
  }
}
