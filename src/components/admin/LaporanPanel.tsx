"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MonthlyTrendChart } from "@/components/admin/MonthlyTrendChart";
import { alertFailBanner } from "@/lib/alertFailBanner";

type TransactionRow = {
  id_pengiriman: number;
  invoiceNumber: string;
  totalLabel: string;
  buyerName: string;
  buyerEmail: string;
  institution: string;
  productName: string;
  quantityLabel: string;
  expedition: string;
  trackingNumber: string;
  paymentMethod: string;
  deliveredAt: string | null;
};

type TrendPoint = {
  month: string;
  monthLabel: string;
  orderCount: number;
  totalRevenue: number;
  totalRevenueLabel: string;
  isSelected?: boolean;
};

type ReportResponse = {
  year?: number;
  month?: string;
  periodLabel?: string;
  summary?: {
    orderCount: number;
    totalRevenueLabel: string;
  };
  trend?: TrendPoint[];
  transactions?: TransactionRow[];
  message?: string;
};

function currentYearValue() {
  return String(new Date().getFullYear());
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function defaultMonthForYear(year: string) {
  const now = new Date();
  if (Number(year) === now.getFullYear()) {
    return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${year}-01`;
}

const YEAR_OPTIONS = (() => {
  const end = new Date().getFullYear();
  const years: number[] = [];
  for (let y = end; y >= 2020; y--) years.push(y);
  return years;
})();

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const laporanStyles = `
  @keyframes laporanIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .laporan-wrap { animation: laporanIn 0.45s ease-out both; }
  .laporan-table-row {
    opacity: 0;
    animation: laporanIn 0.4s ease-out forwards;
  }
  .laporan-summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  .laporan-summary-card {
    border: 1px solid #d0deff;
    border-radius: 12px;
    background: #fff;
    padding: 16px 18px;
    box-shadow: 0 4px 18px rgba(10, 40, 120, 0.08);
  }
  .laporan-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  .laporan-year-input {
    padding: 9px 12px;
    border: 1px solid #dbe7ff;
    border-radius: 8px;
    font-size: 14px;
    font-family: "Plus Jakarta Sans", sans-serif;
    color: #1a3566;
    background: #fff;
    cursor: pointer;
    min-width: 100px;
  }
  .laporan-year-input:focus {
    outline: none;
    border-color: #0b47b8;
    box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.12);
  }
  @media (max-width: 640px) {
    .laporan-summary {
      grid-template-columns: 1fr;
    }
  }
`;

const IconReport = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M9 17v-6M13 17V7M17 17v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H9L5 7v12a2 2 0 002 2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <span className={spinning ? "spinning" : ""} style={{ display: "inline-flex" }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4v6h-6M4 20v-6h6M6.5 9A7 7 0 0119 10M17.5 15A7 7 0 015 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M12 3v12m0 0l4-4m-4 4L8 11M4 19h16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function LaporanPanel() {
  const [year, setYear] = useState(currentYearValue);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [initialLoading, setInitialLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [periodLabel, setPeriodLabel] = useState("");
  const [summary, setSummary] = useState<{ orderCount: number; totalRevenueLabel: string } | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [message, setMessage] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async (manual = false) => {
    const hasChartData = trend.length > 0;
    if (manual) setRefreshing(true);
    else if (!hasChartData) setInitialLoading(true);
    else setDetailLoading(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/admin/laporan?year=${encodeURIComponent(year)}&month=${encodeURIComponent(selectedMonth)}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as ReportResponse;
      if (!res.ok) {
        setMessage(data.message ?? "Failed to load report.");
        if (!hasChartData) {
          setSummary(null);
          setTrend([]);
          setTransactions([]);
        }
        return;
      }
      setPeriodLabel(data.periodLabel ?? "");
      setSummary(data.summary ?? null);
      setTransactions(data.transactions ?? []);
      setTrend((prev) => {
        if (prev.length > 0 && prev[0]?.month.startsWith(`${year}-`)) return prev;
        return data.trend ?? [];
      });
    } catch {
      setMessage("Could not reach the server.");
      if (!hasChartData) {
        setSummary(null);
        setTrend([]);
        setTransactions([]);
      }
    } finally {
      setInitialLoading(false);
      setDetailLoading(false);
      setRefreshing(false);
    }
  }, [year, selectedMonth, trend.length]);

  useEffect(() => {
    load();
  }, [load]);

  const tableLoading = initialLoading || detailLoading || refreshing;

  const subtitle = useMemo(() => {
    if (periodLabel) return `Successful order transactions — ${periodLabel}`;
    return "Successful order transactions by month";
  }, [periodLabel]);

  const reportPdfLabel = useMemo(() => {
    if (periodLabel) return `${periodLabel} Report PDF`;
    const [y, m] = selectedMonth.split("-");
    if (y && m) {
      const d = new Date(Number.parseInt(y, 10), Number.parseInt(m, 10) - 1, 1);
      if (!Number.isNaN(d.getTime())) {
        return `${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} Report PDF`;
      }
    }
    return "Report PDF";
  }, [periodLabel, selectedMonth]);

  const openReportPdf = async () => {
    setPdfLoading(true);
    setMessage("");
    const previewTab = window.open("about:blank", "_blank");
    try {
      const res = await fetch(
        `/api/admin/laporan/pdf?year=${encodeURIComponent(year)}&month=${encodeURIComponent(selectedMonth)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        previewTab?.close();
        const data = (await res.json()) as { message?: string };
        setMessage(data.message ?? "Failed to open PDF.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (previewTab) {
        previewTab.location.href = url;
        previewTab.opener = null;
      } else {
        window.open(url, "_blank");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      previewTab?.close();
      setMessage("Could not open PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="laporan-wrap">
      <style>{laporanStyles}</style>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { display: inline-block; animation: spin 0.9s linear infinite; }
      `}</style>

      <header>
        <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Reports</h1>
        <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>{subtitle}</p>
      </header>

      {message ? (
        <div style={{ margin: "0 0 14px", ...alertFailBanner }}>{message}</div>
      ) : null}

      <div className="laporan-toolbar">
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#4a6490" }}>
          <span style={{ fontWeight: 600 }}>Year</span>
          <select
            className="laporan-year-input"
            value={year}
            onChange={(e) => {
              const nextYear = e.target.value;
              setYear(nextYear);
              setSelectedMonth(defaultMonthForYear(nextYear));
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="acct-btn acct-btn--ghost" onClick={() => load(true)}>
          <IconRefresh spinning={refreshing} />
          {refreshing ? "Loading…" : "Refresh"}
        </button>
      </div>

      {trend.length > 0 ? (
        <MonthlyTrendChart
          points={trend}
          chartYear={Number(year)}
          selectedMonth={selectedMonth}
          onSelectMonth={(monthKey) => {
            if (monthKey !== selectedMonth) setSelectedMonth(monthKey);
          }}
        />
      ) : initialLoading ? (
        <div
          style={{
            border: "1px solid #d0deff",
            borderRadius: 12,
            background: "#fff",
            padding: "40px 18px",
            marginBottom: 18,
            textAlign: "center",
            color: "#6a84b0",
            fontSize: 14,
          }}
        >
          Loading chart…
        </div>
      ) : null}

      {summary ? (
        <div
          className="laporan-summary"
          style={{ opacity: detailLoading ? 0.55 : 1, transition: "opacity 0.15s ease" }}
        >
          <div className="laporan-summary-card">
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#6a84b0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total transactions
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, color: "#051c4a" }}>
              {summary.orderCount.toLocaleString("en-GB")}
            </p>
          </div>
          <div className="laporan-summary-card">
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#6a84b0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total transaction value
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 700, color: "#0b47b8" }}>
              {summary.totalRevenueLabel}
            </p>
          </div>
        </div>
      ) : null}

      <div className="admin-table-card admin-table--responsive">
        <div className="admin-table-card__head">
          <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <IconReport />
            <span>
              Transaction list
              {periodLabel ? (
                <span style={{ fontWeight: 500, color: "#6a84b0" }}> — {periodLabel}</span>
              ) : null}
            </span>
          </span>
          <button
            type="button"
            className="acct-btn acct-btn--primary"
            disabled={pdfLoading || initialLoading}
            onClick={() => void openReportPdf()}
          >
            <IconDownload />
            {pdfLoading ? "Generating…" : reportPdfLabel}
          </button>
        </div>

        {tableLoading && transactions.length === 0 ? (
          <div className="admin-table-card__empty">
            <p style={{ margin: 0, color: "#6a84b0" }}>Loading report…</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="admin-table-card__empty">
            <IconReport />
            <p style={{ margin: "8px 0 0" }}>No successful transactions for this month.</p>
          </div>
        ) : (
          <div style={{ opacity: detailLoading ? 0.55 : 1, transition: "opacity 0.15s ease" }}>
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Invoice / Buyer</th>
                <th>Product</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Delivered</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row, index) => (
                <tr
                  key={row.id_pengiriman}
                  className="laporan-table-row"
                  style={{ animationDelay: `${Math.min(index, 10) * 65 + 70}ms` }}
                >
                  <td className="cell-wrap" data-label="Invoice / Buyer">
                    <strong>{row.buyerName}</strong>
                    <br />
                    <span style={{ fontSize: "13px", color: "#6a84b0" }}>{row.invoiceNumber}</span>
                    <br />
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{row.institution || row.buyerEmail}</span>
                  </td>
                  <td className="cell-wrap" data-label="Product" style={{ color: "#4a6490", fontSize: "14px" }}>
                    {row.productName}
                    <br />
                    <span style={{ fontSize: "12px" }}>{row.quantityLabel}</span>
                    {row.expedition ? (
                      <>
                        <br />
                        <span style={{ fontSize: "12px" }}>{row.expedition}</span>
                      </>
                    ) : null}
                  </td>
                  <td data-label="Total" style={{ fontWeight: 600, color: "#051c4a", whiteSpace: "nowrap" }}>
                    {row.totalLabel}
                  </td>
                  <td data-label="Payment" style={{ fontSize: "13px", color: "#4a6490" }}>
                    {row.paymentMethod}
                  </td>
                  <td data-label="Delivered" style={{ fontSize: "13px", color: "#4a6490", whiteSpace: "nowrap" }}>
                    {formatWhen(row.deliveredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
