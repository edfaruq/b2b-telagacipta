import { formatPriceIdr } from "@/lib/catalog-product";
import { getDbPool } from "@/lib/db";
import { ensurePengirimanSchema } from "@/lib/ensure-pengiriman-schema";
import { paymentMethodLabel } from "@/lib/payment-method";

export type AdminLaporanTransaction = {
  id_pengiriman: number;
  id_invoice: number;
  invoiceNumber: string;
  totalAmount: number;
  totalLabel: string;
  buyerName: string;
  buyerEmail: string;
  institution: string;
  productName: string;
  quantity: number;
  quantityLabel: string;
  expedition: string;
  trackingNumber: string;
  paymentMethod: string;
  deliveredAt: string | null;
  deliveredLabel: string;
  paidAt: string | null;
  invoicedAt: string | null;
};

export type AdminLaporanTrendPoint = {
  month: string;
  monthLabel: string;
  orderCount: number;
  totalRevenue: number;
  totalRevenueLabel: string;
  isSelected: boolean;
};

export type AdminLaporanData = {
  year: number;
  month: string;
  periodLabel: string;
  summary: {
    orderCount: number;
    totalRevenue: number;
    totalRevenueLabel: string;
  };
  trend: AdminLaporanTrendPoint[];
  transactions: AdminLaporanTransaction[];
};

export function parseLaporanParams(
  searchParams: URLSearchParams
): { chartYear: number; detailMonthKey: string } | null {
  const yearRaw = searchParams.get("year")?.trim();
  if (!yearRaw || !/^\d{4}$/.test(yearRaw)) return null;

  const chartYear = Number.parseInt(yearRaw, 10);
  if (!Number.isInteger(chartYear) || chartYear < 2000 || chartYear > 2100) return null;

  let detailMonthKey = searchParams.get("month")?.trim() ?? "";
  if (!detailMonthKey) {
    const now = new Date();
    detailMonthKey =
      chartYear === now.getFullYear()
        ? `${chartYear}-${String(now.getMonth() + 1).padStart(2, "0")}`
        : `${chartYear}-01`;
  }

  if (!/^\d{4}-\d{2}$/.test(detailMonthKey)) return null;
  const [, monthStr] = detailMonthKey.split("-");
  const month = Number.parseInt(monthStr, 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  return { chartYear, detailMonthKey };
}

function yearBounds(year: number) {
  return {
    start: `${year}-01-01 00:00:00`,
    end: `${year + 1}-01-01 00:00:00`,
  };
}

function monthBounds(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01 00:00:00`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01 00:00:00`;
  return { start, end };
}

function calendarYearMonthKeys(year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `${year}-${String(m).padStart(2, "0")}`;
  });
}

function calendarMonthLabel(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

function formatWhen(value: string | Date | null) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatDeliveredLabel(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function fetchAdminLaporan(
  chartYear: number,
  detailMonthKey: string
): Promise<AdminLaporanData> {
  const [detailYearStr, detailMonthStr] = detailMonthKey.split("-");
  const detailYear = Number.parseInt(detailYearStr, 10);
  const detailMonth = Number.parseInt(detailMonthStr, 10);
  const { start: detailStart, end: detailEnd } = monthBounds(detailYear, detailMonth);
  const { start: trendStart, end: trendEnd } = yearBounds(chartYear);
  const trendKeys = calendarYearMonthKeys(chartYear);

  const pool = getDbPool();
  await ensurePengirimanSchema(pool);

  const [trendRows] = await pool.query(
    `SELECT
       DATE_FORMAT(pg.tanggal_diterima, '%Y-%m') AS month_key,
       COUNT(*) AS order_count,
       COALESCE(SUM(inv.total_invoice), 0) AS total_revenue
     FROM pengiriman pg
     INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
     INNER JOIN pembayaran pb ON pb.id_invoice = inv.id_invoice
     WHERE inv.status_invoice = 'lunas'
       AND pb.status_pembayaran = 'valid'
       AND pg.status_pengiriman = 'diterima'
       AND pg.tanggal_diterima >= ?
       AND pg.tanggal_diterima < ?
     GROUP BY month_key
     ORDER BY month_key ASC`,
    [trendStart, trendEnd]
  );

  const trendMap = new Map<string, { orderCount: number; totalRevenue: number }>();
  for (const row of trendRows as Array<{
    month_key: string;
    order_count: string | number;
    total_revenue: string | number;
  }>) {
    trendMap.set(row.month_key, {
      orderCount: Number(row.order_count) || 0,
      totalRevenue: Number(row.total_revenue) || 0,
    });
  }

  const trend = trendKeys.map((key) => {
    const data = trendMap.get(key) ?? { orderCount: 0, totalRevenue: 0 };
    const monthNum = Number.parseInt(key.split("-")[1], 10);
    return {
      month: key,
      monthLabel: calendarMonthLabel(monthNum),
      orderCount: data.orderCount,
      totalRevenue: data.totalRevenue,
      totalRevenueLabel: formatPriceIdr(data.totalRevenue),
      isSelected: key === detailMonthKey,
    };
  });

  const [rows] = await pool.query(
    `SELECT
       pg.id_pengiriman,
       pg.id_invoice,
       pg.nomor_resi,
       pg.tanggal_diterima,
       inv.nomor_invoice,
       inv.tanggal_invoice,
       inv.total_invoice,
       pb.metode_pembayaran,
       pb.tanggal_validasi,
       pl.nama,
       pl.email,
       pl.instansi,
       p.nama_produk,
       p.satuan,
       pm.jumlah_permintaan,
       pw.ekspedisi
     FROM pengiriman pg
     INNER JOIN invoice inv ON inv.id_invoice = pg.id_invoice
     INNER JOIN pembayaran pb ON pb.id_invoice = inv.id_invoice
     INNER JOIN penawaran pw ON pw.id_penawaran = inv.id_penawaran
     INNER JOIN permintaan pm ON pm.id_permintaan = pw.id_permintaan
     INNER JOIN pelanggan pl ON pl.id_pelanggan = pm.id_pelanggan
     INNER JOIN produk p ON p.id_produk = pm.id_produk
     WHERE inv.status_invoice = 'lunas'
       AND pb.status_pembayaran = 'valid'
       AND pg.status_pengiriman = 'diterima'
       AND pg.tanggal_diterima >= ?
       AND pg.tanggal_diterima < ?
     ORDER BY pg.tanggal_diterima ASC, inv.nomor_invoice ASC`,
    [detailStart, detailEnd]
  );

  type DbRow = {
    id_pengiriman: number;
    id_invoice: number;
    nomor_resi: string | null;
    tanggal_diterima: string | Date | null;
    nomor_invoice: string;
    tanggal_invoice: string | Date | null;
    total_invoice: string | number;
    metode_pembayaran: string | null;
    tanggal_validasi: string | Date | null;
    nama: string;
    email: string;
    instansi: string;
    nama_produk: string;
    satuan: string;
    jumlah_permintaan: string | number;
    ekspedisi: string;
  };

  let totalRevenue = 0;
  const transactions = (rows as DbRow[]).map((row) => {
    const amount = Number(row.total_invoice) || 0;
    totalRevenue += amount;
    const qty = Number(row.jumlah_permintaan) || 0;
    const unit = (row.satuan ?? "kg").trim() || "kg";
    const deliveredAt = formatWhen(row.tanggal_diterima);

    return {
      id_pengiriman: row.id_pengiriman,
      id_invoice: row.id_invoice,
      invoiceNumber: row.nomor_invoice,
      totalAmount: amount,
      totalLabel: formatPriceIdr(amount),
      buyerName: row.nama,
      buyerEmail: row.email,
      institution: row.instansi,
      productName: row.nama_produk,
      quantity: qty,
      quantityLabel: `${qty.toLocaleString("en-GB")} ${unit}`,
      expedition: (row.ekspedisi ?? "").trim(),
      trackingNumber: row.nomor_resi?.trim() || "",
      paymentMethod: paymentMethodLabel(row.metode_pembayaran),
      deliveredAt,
      deliveredLabel: formatDeliveredLabel(deliveredAt),
      paidAt: formatWhen(row.tanggal_validasi),
      invoicedAt: formatWhen(row.tanggal_invoice),
    };
  });

  const periodLabel = new Date(detailYear, detailMonth - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return {
    year: chartYear,
    month: detailMonthKey,
    periodLabel,
    summary: {
      orderCount: transactions.length,
      totalRevenue,
      totalRevenueLabel: formatPriceIdr(totalRevenue),
    },
    trend,
    transactions,
  };
}
