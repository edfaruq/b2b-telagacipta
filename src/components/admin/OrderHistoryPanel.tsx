"use client";

import { useCallback, useEffect, useState } from "react";
import { StarRatingDisplay } from "@/components/shared/StarRating";
import { alertFailBanner } from "@/lib/alertFailBanner";

type HistoryRow = {
  id_pengiriman: number;
  id_invoice: number;
  invoiceNumber: string;
  totalLabel: string;
  buyerName: string;
  buyerEmail: string;
  institution: string;
  productName: string;
  expedition: string;
  trackingNumber: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  rating: number | null;
  feedback: string;
};

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

const histAnimStyles = `
  @keyframes histPageIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .hist-wrap { animation: histPageIn 0.45s ease-out both; }
  .hist-table-row {
    opacity: 0;
    animation: histPageIn 0.4s ease-out forwards;
  }
  .hist-feedback {
    margin: 0;
    font-size: 13px;
    color: #4a6490;
    line-height: 1.45;
    max-width: 280px;
  }
  @media (max-width: 768px) {
    .hist-feedback {
      max-width: none;
    }
  }
`;

const IconHistory = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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

type Props = {
  embedded?: boolean;
};

export function OrderHistoryPanel({ embedded = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<HistoryRow[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/order-history", { cache: "no-store" });
      const data = (await res.json()) as { orders?: HistoryRow[]; message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to load order history.");
        setMessageTone("error");
        setOrders([]);
        return;
      }
      setOrders(data.orders ?? []);
      if (manual) setMessage("");
    } catch {
      setMessage("Could not reach the server.");
      setMessageTone("error");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="hist-wrap">
      <style>{histAnimStyles}</style>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { display: inline-block; animation: spin 0.9s linear infinite; }
      `}</style>

      {!embedded ? (
        <header>
          <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Order history</h1>
          <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
            Completed deliveries and customer feedback.
          </p>
        </header>
      ) : null}

      {message ? (
        <div
          style={{
            margin: "0 0 14px",
            ...(messageTone === "error"
              ? alertFailBanner
              : {
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: "14px",
                }),
          }}
        >
          {message}
        </div>
      ) : null}

      <div className="admin-table-card">
        <div className="admin-table-card__head">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconHistory />
            Delivered orders
          </span>
          <button type="button" className="acct-btn acct-btn--ghost" onClick={() => load(true)}>
            <IconRefresh spinning={refreshing} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="admin-table-card__empty">
            <p style={{ margin: 0, color: "#6a84b0" }}>Loading…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-table-card__empty">
            <IconHistory />
            <p style={{ margin: "8px 0 0" }}>No completed orders yet.</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Buyer / Invoice</th>
                <th>Product</th>
                <th>Delivered</th>
                <th>Rating</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row, index) => (
                <tr
                  key={row.id_pengiriman}
                  className="hist-table-row"
                  style={{ animationDelay: `${Math.min(index, 10) * 65 + 70}ms` }}
                >
                  <td className="cell-wrap">
                    <strong>{row.buyerName}</strong>
                    <br />
                    <span style={{ fontSize: "13px", color: "#6a84b0" }}>{row.invoiceNumber}</span>
                    <br />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#051c4a" }}>
                      {row.totalLabel}
                    </span>
                  </td>
                  <td className="cell-wrap" style={{ color: "#4a6490", fontSize: "14px" }}>
                    {row.productName}
                    <br />
                    <span style={{ fontSize: "12px" }}>{row.expedition || "—"}</span>
                    {row.trackingNumber ? (
                      <>
                        <br />
                        <span style={{ fontSize: "12px" }}>Resi: {row.trackingNumber}</span>
                      </>
                    ) : null}
                  </td>
                  <td style={{ fontSize: "13px", color: "#4a6490", whiteSpace: "nowrap" }}>
                    {formatWhen(row.deliveredAt)}
                  </td>
                  <td>
                    {row.rating != null && row.rating > 0 ? (
                      <StarRatingDisplay value={row.rating} size={16} />
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td>
                    {row.feedback ? (
                      <p className="hist-feedback">{row.feedback}</p>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
