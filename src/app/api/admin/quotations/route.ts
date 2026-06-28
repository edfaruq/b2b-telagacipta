import { NextResponse } from "next/server";
import { formatPriceIdr } from "@/lib/catalog-product";
import { getServerSession } from "@/lib/get-server-session";
import { getDbPool } from "@/lib/db";
import { computeTotalPenawaran } from "@/lib/penawaran";

type PendingQuotationRow = {
  id_permintaan: number;
  jumlah_permintaan: string | number;
  detail_permintaan: string | null;
  alamat_tujuan: string;
  tanggal_permintaan: string | Date;
  nama: string;
  instansi: string;
  email: string;
  no_telepon: string;
  negara: string;
  nama_produk: string;
  slug: string;
  satuan: string;
  harga_indikatif: string | number;
  request_sequence: string | number;
};

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT
         pm.id_permintaan,
         pm.jumlah_permintaan,
         pm.detail_permintaan,
         pm.alamat_tujuan,
         pm.tanggal_permintaan,
         pl.nama,
         pl.instansi,
         pl.email,
         pl.no_telepon,
         pl.negara,
         p.nama_produk,
         p.slug,
         p.satuan,
         p.harga_indikatif,
         (SELECT COUNT(*)
          FROM permintaan x
          WHERE x.id_permintaan <= pm.id_permintaan) AS request_sequence
       FROM permintaan pm
       INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
       INNER JOIN produk p ON p.id_produk = pm.id_produk
       WHERE pm.status_permintaan = 'menunggu'
       ORDER BY pm.tanggal_permintaan ASC`
    );

    const quotations = (rows as PendingQuotationRow[]).map((row) => {
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

      return {
        id_permintaan: row.id_permintaan,
        requestSequence: Number(row.request_sequence) || 1,
        jumlah_permintaan: qty,
        detail_permintaan: row.detail_permintaan ?? "",
        alamat_tujuan: row.alamat_tujuan,
        tanggal_permintaan: tanggal,
        nama: row.nama,
        instansi: row.instansi,
        email: row.email,
        no_telepon: row.no_telepon,
        negara: row.negara,
        nama_produk: row.nama_produk,
        slug: row.slug,
        satuan,
        unitPriceAmount: safeUnit,
        unitPriceLabel: formatPriceIdr(safeUnit),
        estimatedTotalLabel: formatPriceIdr(safeUnit * qty),
      };
    });

    const [rejectedRows] = await pool.query(
      `SELECT
         pm.id_permintaan,
         pm.jumlah_permintaan,
         pm.detail_permintaan,
         pm.alamat_tujuan,
         pm.tanggal_permintaan,
         pl.nama,
         pl.instansi,
         pl.email,
         pl.no_telepon,
         pl.negara,
         p.nama_produk,
         p.slug,
         p.satuan,
         p.harga_indikatif,
         pw.harga_ton,
         pw.biaya_pengiriman,
         pw.ekspedisi,
         pw.total_penawaran,
         pw.tanggal_penawaran,
         (SELECT COUNT(*)
          FROM permintaan x
          WHERE x.id_permintaan <= pm.id_permintaan) AS request_sequence
       FROM permintaan pm
       INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
       INNER JOIN produk p ON p.id_produk = pm.id_produk
       INNER JOIN penawaran pw ON pw.id_permintaan = pm.id_permintaan
       WHERE pm.status_permintaan = 'ditolak'
         AND pw.status_penawaran = 'ditolak'
       ORDER BY pm.tanggal_permintaan DESC`
    );

    const rejected = (
      rejectedRows as Array<
        PendingQuotationRow & {
          harga_ton: string | number;
          biaya_pengiriman: string | number;
          ekspedisi: string;
          total_penawaran: string | number;
          tanggal_penawaran: string | Date;
        }
      >
    ).map((row) => {
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
      const hargaTon = Number(row.harga_ton) || 0;
      const biaya = Number(row.biaya_pengiriman) || 0;
      const total = Number(row.total_penawaran) || 0;

      return {
        id_permintaan: row.id_permintaan,
        requestSequence: Number(row.request_sequence) || 1,
        jumlah_permintaan: qty,
        detail_permintaan: row.detail_permintaan ?? "",
        alamat_tujuan: row.alamat_tujuan,
        tanggal_permintaan: tanggal,
        nama: row.nama,
        instansi: row.instansi,
        email: row.email,
        no_telepon: row.no_telepon,
        negara: row.negara,
        nama_produk: row.nama_produk,
        slug: row.slug,
        satuan,
        unitPriceAmount: safeUnit,
        unitPriceLabel: formatPriceIdr(safeUnit),
        estimatedTotalLabel: formatPriceIdr(safeUnit * qty),
        quotationUnitPriceLabel: formatPriceIdr(hargaTon),
        shippingLabel: formatPriceIdr(biaya),
        totalQuotationLabel: formatPriceIdr(total),
        expedition: (row.ekspedisi ?? "").trim(),
      };
    });

    return NextResponse.json({ quotations, rejected });
  } catch {
    return NextResponse.json({ message: "Could not load quotation requests." }, { status: 500 });
  }
}

type SendQuotationBody = {
  id_permintaan?: number;
  harga_ton?: number | string;
  biaya_pengiriman?: number | string;
  ekspedisi?: string;
  expedition?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let payload: SendQuotationBody;
  try {
    payload = (await request.json()) as SendQuotationBody;
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const idPermintaan = Number(payload.id_permintaan);
  const hargaTon = Number(payload.harga_ton);
  const biayaPengiriman = Number(payload.biaya_pengiriman ?? 0);
  const ekspedisi = (payload.ekspedisi ?? payload.expedition ?? "").trim();

  if (!Number.isInteger(idPermintaan) || idPermintaan <= 0) {
    return NextResponse.json({ message: "Invalid id_permintaan." }, { status: 400 });
  }
  if (!Number.isFinite(hargaTon) || hargaTon <= 0) {
    return NextResponse.json({ message: "Unit price must be greater than 0." }, { status: 400 });
  }
  if (!Number.isFinite(biayaPengiriman) || biayaPengiriman < 0) {
    return NextResponse.json({ message: "Shipping cost cannot be negative." }, { status: 400 });
  }
  if (!ekspedisi || ekspedisi.length > 120) {
    return NextResponse.json(
      { message: "Expedition name is required (max 120 characters)." },
      { status: 400 }
    );
  }

  try {
    const pool = getDbPool();

    const [permRows] = await pool.query(
      `SELECT id_permintaan, jumlah_permintaan, status_permintaan
       FROM permintaan WHERE id_permintaan = ? LIMIT 1`,
      [idPermintaan]
    );
    const perm = (permRows as Array<{
      id_permintaan: number;
      jumlah_permintaan: string | number;
      status_permintaan: string;
    }>)[0];

    if (!perm) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }
    if (perm.status_permintaan !== "menunggu") {
      return NextResponse.json(
        { message: "This request has already been processed." },
        { status: 400 }
      );
    }

    const [existing] = await pool.query(
      "SELECT id_penawaran FROM penawaran WHERE id_permintaan = ? LIMIT 1",
      [idPermintaan]
    );
    if ((existing as Array<{ id_penawaran: number }>).length > 0) {
      return NextResponse.json(
        { message: "A quotation has already been sent for this request." },
        { status: 400 }
      );
    }

    const qty = Number(perm.jumlah_permintaan) || 0;
    const totalPenawaran = computeTotalPenawaran(hargaTon, qty, biayaPengiriman);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [insertResult] = await conn.query(
        `INSERT INTO penawaran (
           id_permintaan, id_admin, harga_ton, biaya_pengiriman, ekspedisi, total_penawaran, status_penawaran
         ) VALUES (?, ?, ?, ?, ?, ?, 'dikirim')`,
        [idPermintaan, session.userId, hargaTon, biayaPengiriman, ekspedisi, totalPenawaran]
      );

      const [updateResult] = await conn.query(
        `UPDATE permintaan SET status_permintaan = 'diproses'
         WHERE id_permintaan = ? AND status_permintaan = 'menunggu'`,
        [idPermintaan]
      );

      const updated = (updateResult as { affectedRows: number }).affectedRows;
      if (updated === 0) {
        await conn.rollback();
        return NextResponse.json(
          { message: "Request not found or already processed." },
          { status: 404 }
        );
      }

      await conn.commit();

      const insertId = (insertResult as { insertId?: number }).insertId;

      return NextResponse.json({
        message: "Quotation sent to customer successfully.",
        penawaran: {
          id_penawaran: insertId,
          id_permintaan: idPermintaan,
          harga_ton: hargaTon,
          biaya_pengiriman: biayaPengiriman,
          ekspedisi,
          total_penawaran: totalPenawaran,
          total_penawaran_label: formatPriceIdr(totalPenawaran),
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch {
    return NextResponse.json({ message: "Could not send quotation." }, { status: 500 });
  }
}
