"use client";

import { useState } from "react";
import { SendQuotationModal } from "@/components/admin/SendQuotationModal";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { permintaanRequestIdLabel } from "@/lib/permintaan-request-id";

export type PendingQuotationRow = {
  id_permintaan: number;
  requestSequence: number;
  jumlah_permintaan: number;
  detail_permintaan: string;
  alamat_tujuan: string;
  tanggal_permintaan: string;
  nama: string;
  instansi: string;
  email: string;
  no_telepon: string;
  negara: string;
  nama_produk: string;
  slug: string;
  satuan: string;
  unitPriceAmount: number;
  unitPriceLabel: string;
  estimatedTotalLabel: string;
};

const IconQuotation = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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

const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  quotations: PendingQuotationRow[];
  loading: boolean;
  refreshing: boolean;
  processingKey: string | null;
  message: string;
  messageTone: "success" | "error";
  onRefresh: () => void;
  onSendQuotation: () => Promise<void>;
};

export function PendingQuotationsPanel({
  quotations,
  loading,
  refreshing,
  processingKey,
  message,
  messageTone,
  onRefresh,
  onSendQuotation,
}: Props) {
  const [selected, setSelected] = useState<PendingQuotationRow | null>(null);
  const [sendTarget, setSendTarget] = useState<PendingQuotationRow | null>(null);

  return (
    <>
      <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Pending Request Quotation</h1>
      <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
        Review requests and send quotations to customers.
      </p>

      {message ? (
        <div
          style={{
            margin: "0 0 14px",
            animation: "fadeInUp 0.25s ease both",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            ...(messageTone === "error"
              ? alertFailBanner
              : {
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: "14px",
                  fontWeight: 500,
                }),
          }}
        >
          {messageTone === "error" ? (
            <span style={{ display: "inline-flex", flexShrink: 0 }}>
              <IconClose />
            </span>
          ) : null}
          {message}
        </div>
      ) : null}

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px 0", color: "#6A84B0" }}>
          <span className="spinning" style={{ display: "inline-flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 4v6h-6M4 20v-6h6M6.5 9A7 7 0 0119 10M17.5 15A7 7 0 015 14"
                stroke="#6A84B0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Loading quotations…
        </div>
      ) : null}

      <div className="admin-table-card card-anim">
        <div className="admin-table-card__head">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconQuotation />
            Waiting for review
            {quotations.length > 0 && (
              <span className="acct-count-badge acct-count-badge--warn">
                <span className="pending-dot" />
                {quotations.length}
              </span>
            )}
          </span>
          <button type="button" className="acct-btn acct-btn--ghost" onClick={onRefresh}>
            <IconRefresh spinning={refreshing} />
            Refresh
          </button>
        </div>

        {quotations.length === 0 ? (
          <div className="admin-table-card__empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.35">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                stroke="#6A84B0"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={{ margin: 0, fontSize: "14px" }}>No quotation requests waiting for review.</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <colgroup>
              <col className="col-name" />
              <col className="col-name" />
              <col className="col-stock" />
              <col className="col-price" />
              <col className="col-date" />
              <col className="col-actions-wide" />
            </colgroup>
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Est. Total</th>
                <th>Requested</th>
                <th className="admin-th-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((row) => {
                const qtyLabel = Number.isInteger(row.jumlah_permintaan)
                  ? String(row.jumlah_permintaan)
                  : row.jumlah_permintaan.toLocaleString("id-ID");
                const dateLabel = new Date(row.tanggal_permintaan).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                const qKey = row.id_permintaan;

                return (
                  <tr key={row.id_permintaan} className="table-row">
                    <td className="cell-clip" style={{ fontWeight: 600 }} title={row.nama}>
                      {row.nama}
                    </td>
                    <td className="cell-clip" style={{ color: "#4A6490" }} title={row.nama_produk}>
                      {row.nama_produk}
                    </td>
                    <td className="cell-clip" style={{ color: "#4A6490" }}>
                      {qtyLabel} {row.satuan}
                    </td>
                    <td className="cell-clip" style={{ fontWeight: 600, color: "#051C4A" }}>
                      {row.estimatedTotalLabel}
                    </td>
                    <td className="cell-clip" style={{ color: "#4A6490", fontSize: "13px" }}>
                      {dateLabel}
                    </td>
                    <td className="admin-td-actions">
                      <div className="acct-btn-group">
                        <button
                          type="button"
                          className="acct-btn acct-btn--outline"
                          onClick={() => setSelected(row)}
                        >
                          <IconEye />
                          Details
                        </button>
                        <button
                          type="button"
                          className="acct-btn acct-btn--primary"
                          onClick={() => {
                            setSelected(null);
                            setSendTarget(row);
                          }}
                          disabled={processingKey === `q-send-${qKey}`}
                        >
                          <IconQuotation />
                          Send Quotation
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <div
          className="overlay-anim"
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 28, 74, 0.40)",
            backdropFilter: "blur(3px)",
            display: "grid",
            placeItems: "center",
            zIndex: 60,
            padding: "16px",
          }}
        >
          <div
            className="modal-anim"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, calc(100vw - 32px))",
              maxHeight: "min(92vh, 860px)",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #d0deff",
              boxShadow: "0 20px 50px rgba(10,40,120,0.22)",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #edf2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f7faff",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "#051C4A",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconQuotation />
                {permintaanRequestIdLabel(selected.requestSequence, selected.tanggal_permintaan)}
              </span>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  border: "1px solid #d0deff",
                  borderRadius: "999px",
                  background: "#fff",
                  color: "#6A84B0",
                  cursor: "pointer",
                  display: "inline-flex",
                  padding: "5px",
                }}
              >
                <IconClose />
              </button>
            </div>

            <div style={{ padding: "24px 28px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { label: "Buyer", value: selected.nama },
                  { label: "Product", value: selected.nama_produk },
                  { label: "Institution", value: selected.instansi },
                  { label: "Email Address", value: selected.email },
                  { label: "Phone", value: selected.no_telepon },
                  { label: "Country", value: selected.negara },
                  {
                    label: "Quantity",
                    value: `${selected.jumlah_permintaan} ${selected.satuan}`,
                  },
                  {
                    label: "Unit price",
                    value: `${selected.unitPriceLabel} /${selected.satuan}`,
                  },
                  { label: "Est. total", value: selected.estimatedTotalLabel },
                  {
                    label: "Requested",
                    value: new Date(selected.tanggal_permintaan).toLocaleString("en-US"),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      background: "#f7faff",
                      border: "1px solid #edf2ff",
                      borderRadius: "8px",
                      padding: "12px 14px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "11px",
                        color: "#6A84B0",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "6px",
                      }}
                    >
                      {label}
                    </p>
                    <p style={{ margin: 0, fontSize: "15px", color: "#1A3566", fontWeight: 500 }}>{value}</p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  background: "#f7faff",
                  border: "1px solid #edf2ff",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    color: "#6A84B0",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "4px",
                  }}
                >
                  Delivery address
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#1A3566", fontWeight: 500 }}>
                  {selected.alamat_tujuan}
                </p>
              </div>

              {selected.detail_permintaan.trim() ? (
                <div
                  style={{
                    marginTop: "12px",
                    background: "#f7faff",
                    border: "1px solid #edf2ff",
                    borderRadius: "8px",
                    padding: "10px 12px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      color: "#6A84B0",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "4px",
                    }}
                  >
                    Notes
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", color: "#1A3566", fontWeight: 500 }}>
                    {selected.detail_permintaan}
                  </p>
                </div>
              ) : null}

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="acct-btn acct-btn--primary"
                  onClick={() => {
                    setSendTarget(selected);
                    setSelected(null);
                  }}
                >
                  <IconQuotation />
                  Send Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {sendTarget ? (
        <SendQuotationModal
          row={sendTarget}
          onClose={() => setSendTarget(null)}
          onSent={onSendQuotation}
        />
      ) : null}
    </>
  );
}
