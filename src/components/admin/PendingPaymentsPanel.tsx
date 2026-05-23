"use client";

import { useCallback, useEffect, useState } from "react";
import { alertFailBanner } from "@/lib/alertFailBanner";

type PaymentRow = {
  id_pembayaran: number;
  id_invoice: number;
  proofUrl: string;
  submittedAt: string;
  statusLabel: string;
  invoiceNumber: string;
  totalLabel: string;
  buyerName: string;
  buyerEmail: string;
  institution: string;
  productName: string;
};

const paymentsAnimStyles = `
  @keyframes payPageIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes payRowIn {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes payShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .pay-wrap {
    animation: payPageIn 0.45s ease-out both;
  }
  .pay-header {
    animation: payPageIn 0.42s ease-out both;
  }
  .pay-msg {
    animation: payPageIn 0.3s ease-out both;
  }
  .pay-table-card {
    animation: payPageIn 0.45s 0.08s ease-out both;
  }
  .pay-table-row {
    opacity: 0;
    animation: payRowIn 0.4s ease-out forwards;
  }
  .pay-skeleton-block {
    background: linear-gradient(90deg, #e6edf9 0%, #f5f8ff 45%, #e6edf9 90%);
    background-size: 200% 100%;
    animation: payShimmer 1.35s ease-in-out infinite;
    border-radius: 10px;
  }
  .pay-skeleton-row--skeleton:hover {
    background: transparent !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .pay-wrap,
    .pay-header,
    .pay-msg,
    .pay-table-card,
    .pay-table-row {
      animation: none;
      opacity: 1;
      transform: none;
    }
    .pay-skeleton-block {
      animation: none;
      background: #e6edf9;
    }
  }
`;

const IconPayment = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
      stroke="currentColor"
      strokeWidth="1.85"
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

function PaymentsLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="pay-skeleton-body" aria-busy="true" aria-label="Loading payments">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="pay-skeleton-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 0.9fr 0.6fr 1.1fr",
            gap: 16,
            padding: "14px 18px",
            borderTop: i === 0 ? "none" : "1px solid #edf2ff",
            animationDelay: `${i * 70 + 50}ms`,
          }}
        >
          <div>
            <div className="pay-skeleton-block" style={{ height: 14, width: "70%", marginBottom: 8 }} />
            <div className="pay-skeleton-block" style={{ height: 12, width: "55%" }} />
          </div>
          <div>
            <div className="pay-skeleton-block" style={{ height: 14, width: "65%", marginBottom: 8 }} />
            <div className="pay-skeleton-block" style={{ height: 12, width: "45%" }} />
          </div>
          <div className="pay-skeleton-block" style={{ height: 14, width: "80%" }} />
          <div className="pay-skeleton-block" style={{ height: 14, width: "60%" }} />
          <div className="pay-skeleton-block" style={{ height: 36, width: "100%", borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

type Props = {
  embedded?: boolean;
  onActivity?: () => void;
};

export function PendingPaymentsPanel({ embedded = false, onActivity }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/payments", { cache: "no-store" });
      const data = (await res.json()) as { payments?: PaymentRow[]; message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to load payments.");
        setMessageTone("error");
        setPayments([]);
        return;
      }
      setPayments(data.payments ?? []);
      if (manual) setMessage("");
    } catch {
      setMessage("Could not reach the server.");
      setMessageTone("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const key = `${action}-${id}`;
    setProcessingKey(key);
    setMessage("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_pembayaran: id, action }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to update payment.");
        setMessageTone("error");
        return;
      }
      setMessage(data.message ?? "Payment updated.");
      setMessageTone("success");
      await load();
      onActivity?.();
    } catch {
      setMessage("Could not reach the server.");
      setMessageTone("error");
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="pay-wrap">
      <style>{paymentsAnimStyles}</style>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinning {
          display: inline-block;
          animation: spin 0.9s linear infinite;
        }
      `}</style>

      {!embedded ? (
        <header className="pay-header">
          <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Payment Validation</h1>
          <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
            Validate buyer payment proofs to unlock invoice PDF download.
          </p>
        </header>
      ) : null}

      {message ? (
        <div
          className="pay-msg"
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

      <div className="admin-table-card pay-table-card">
        <div className="admin-table-card__head">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconPayment />
            Awaiting validation
            {payments.length > 0 && !loading ? (
              <span className="acct-count-badge acct-count-badge--warn">
                <span className="pending-dot" />
                {payments.length}
              </span>
            ) : null}
          </span>
          <button type="button" className="acct-btn acct-btn--ghost" onClick={() => load(true)}>
            <IconRefresh spinning={refreshing} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <PaymentsLoadingSkeleton rows={3} />
        ) : payments.length === 0 ? (
          <div className="admin-table-card__empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.35">
              <path
                d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                stroke="#6a84b0"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={{ margin: 0 }}>No payments waiting for validation.</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <colgroup>
              <col className="col-name" />
              <col className="col-name" />
              <col className="col-inst" />
              <col className="col-action" />
              <col className="col-actions-wide" />
            </colgroup>
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Invoice</th>
                <th>Product</th>
                <th>Proof</th>
                <th className="admin-th-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((row, index) => (
                <tr
                  key={row.id_pembayaran}
                  className="table-row pay-table-row"
                  style={{ animationDelay: `${Math.min(index, 10) * 65 + 70}ms` }}
                >
                  <td className="cell-wrap" style={{ fontWeight: 600 }}>
                    {row.buyerName}
                    <br />
                    <span style={{ fontSize: "13px", color: "#6a84b0", fontWeight: 400 }}>
                      {row.buyerEmail}
                    </span>
                  </td>
                  <td className="cell-wrap" style={{ color: "#4a6490" }}>
                    {row.invoiceNumber}
                    <br />
                    <span style={{ fontWeight: 600, color: "#051c4a" }}>{row.totalLabel}</span>
                  </td>
                  <td className="cell-clip" style={{ color: "#4a6490" }} title={row.productName}>
                    {row.productName}
                  </td>
                  <td>
                    <a
                      href={row.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0b47b8", fontWeight: 600, fontSize: "14px" }}
                    >
                      View proof
                    </a>
                  </td>
                  <td className="admin-td-actions">
                    <div className="acct-btn-group">
                      <button
                        type="button"
                        className="acct-btn acct-btn--success"
                        disabled={processingKey !== null}
                        onClick={() => handleAction(row.id_pembayaran, "approve")}
                      >
                        {processingKey === `approve-${row.id_pembayaran}` ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="acct-btn acct-btn--danger-outline"
                        disabled={processingKey !== null}
                        onClick={() => handleAction(row.id_pembayaran, "reject")}
                      >
                        {processingKey === `reject-${row.id_pembayaran}` ? "…" : "Reject"}
                      </button>
                    </div>
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
