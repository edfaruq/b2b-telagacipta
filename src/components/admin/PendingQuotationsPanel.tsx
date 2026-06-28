"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

export type RejectedQuotationRow = PendingQuotationRow & {
  quotationUnitPriceLabel: string;
  shippingLabel: string;
  totalQuotationLabel: string;
  expedition: string;
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

const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M7 10l5 5 5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function QuotationRequestsColGroup({ showExpedition = true }: { showExpedition?: boolean }) {
  return (
    <colgroup>
      <col className="col-name" />
      <col className="col-name" />
      <col className="col-stock" />
      <col className="col-price" />
      {showExpedition ? <col className="col-expedition" /> : null}
      <col className="col-date-requested" />
      <col className="col-actions-wide" />
    </colgroup>
  );
}

function QuotationRequestsTableHead({ showExpedition = true }: { showExpedition?: boolean }) {
  return (
    <thead>
      <tr>
        <th>Buyer</th>
        <th>Product</th>
        <th>Qty</th>
        <th>Total</th>
        {showExpedition ? <th>Expedition</th> : null}
        <th>Requested</th>
        <th className="admin-th-actions">Action</th>
      </tr>
    </thead>
  );
}

type Props = {
  quotations: PendingQuotationRow[];
  rejected: RejectedQuotationRow[];
  loading: boolean;
  refreshing: boolean;
  processingKey: string | null;
  message: string;
  messageTone: "success" | "error";
  onRefresh: () => void;
  onSendQuotation: () => Promise<void>;
  embedded?: boolean;
};

export function PendingQuotationsPanel({
  quotations,
  rejected,
  loading,
  refreshing,
  processingKey,
  message,
  messageTone,
  onRefresh,
  onSendQuotation,
  embedded = false,
}: Props) {
  const [selected, setSelected] = useState<PendingQuotationRow | null>(null);
  const [selectedRejected, setSelectedRejected] = useState<RejectedQuotationRow | null>(null);
  const [sendTarget, setSendTarget] = useState<PendingQuotationRow | null>(null);
  const [rejectedOpen, setRejectedOpen] = useState(false);

  useEffect(() => {
    if (!selectedRejected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedRejected]);

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  return (
    <>
      {!embedded ? (
        <>
          <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>
            Pending Request Quotation
          </h1>
          <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
            Review requests and send quotations to customers.
          </p>
        </>
      ) : null}

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
          <div className="pq-requests-table-wrap">
          <table className="admin-data-table pq-requests-table">
            <QuotationRequestsColGroup showExpedition={false} />
            <QuotationRequestsTableHead showExpedition={false} />
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
                    <td data-label="Buyer" className="pq-cell-text" style={{ fontWeight: 600 }} title={row.nama}>
                      {row.nama}
                    </td>
                    <td data-label="Product" className="pq-cell-text" style={{ color: "#4A6490" }} title={row.nama_produk}>
                      {row.nama_produk}
                    </td>
                    <td data-label="Qty" className="pq-cell-nowrap" style={{ color: "#4A6490" }}>
                      {qtyLabel} {row.satuan}
                    </td>
                    <td data-label="Total" className="pq-cell-nowrap" style={{ fontWeight: 600, color: "#051C4A" }}>
                      <span className="pq-total-hint">Est.</span> {row.estimatedTotalLabel}
                    </td>
                    <td data-label="Requested" className="pq-cell-nowrap" style={{ color: "#4A6490", fontSize: "13px" }}>
                      {dateLabel}
                    </td>
                    <td className="admin-td-actions pq-cell-actions">
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
          </div>
        )}
      </div>

      <div className="admin-table-card pq-rejected-card card-anim">
        <button
          type="button"
          className="admin-table-card__head pq-rejected-toggle"
          onClick={() => setRejectedOpen((open) => !open)}
          aria-expanded={rejectedOpen}
          aria-controls="pq-rejected-panel"
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconClose />
            Rejected quotation
            {rejected.length > 0 ? (
              <span className="pq-rejected-count">{rejected.length}</span>
            ) : null}
          </span>
          <span className="pq-rejected-toggle__meta">
            <span className="pq-rejected-toggle__label">
              {rejectedOpen ? "Hide" : "Show"}
            </span>
            <span className={`pq-rejected-chevron${rejectedOpen ? " is-open" : ""}`}>
              <IconChevron />
            </span>
          </span>
        </button>

        {rejectedOpen ? (
          <div id="pq-rejected-panel">
        {rejected.length === 0 ? (
          <div className="admin-table-card__empty">
            <p style={{ margin: 0, fontSize: "14px", color: "#6a84b0" }}>
              No rejected quotation requests yet.
            </p>
          </div>
        ) : (
          <div className="pq-requests-table-wrap">
          <table className="admin-data-table pq-requests-table">
            <QuotationRequestsColGroup />
            <QuotationRequestsTableHead />
            <tbody>
              {rejected.map((row) => {
                const qtyLabel = Number.isInteger(row.jumlah_permintaan)
                  ? String(row.jumlah_permintaan)
                  : row.jumlah_permintaan.toLocaleString("id-ID");
                const dateLabel = new Date(row.tanggal_permintaan).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <tr key={`rej-${row.id_permintaan}`} className="table-row">
                    <td data-label="Buyer" className="pq-cell-text" style={{ fontWeight: 600 }} title={row.nama}>
                      {row.nama}
                    </td>
                    <td data-label="Product" className="pq-cell-text" style={{ color: "#4A6490" }} title={row.nama_produk}>
                      {row.nama_produk}
                    </td>
                    <td data-label="Qty" className="pq-cell-nowrap" style={{ color: "#4A6490" }}>
                      {qtyLabel} {row.satuan}
                    </td>
                    <td data-label="Total" className="pq-cell-nowrap" style={{ fontWeight: 600, color: "#991b1b" }}>
                      {row.totalQuotationLabel}
                    </td>
                    <td data-label="Expedition" className="pq-cell-nowrap" style={{ color: "#4A6490" }}>
                      {row.expedition || "—"}
                    </td>
                    <td data-label="Requested" className="pq-cell-nowrap" style={{ color: "#4A6490", fontSize: "13px" }}>
                      {dateLabel}
                    </td>
                    <td className="admin-td-actions pq-cell-actions">
                      <button
                        type="button"
                        className="acct-btn acct-btn--outline"
                        onClick={() => setSelectedRejected(row)}
                      >
                        <IconEye />
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
          </div>
        ) : null}
      </div>

      {selected
        ? createPortal(
            <div
              className="overlay-anim pq-detail-overlay"
              role="presentation"
              onClick={() => setSelected(null)}
            >
              <div
                className="overlay-anim pq-detail-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pq-detail-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pq-detail-dialog__header">
              <div>
                <span
                  id="pq-detail-title"
                  style={{
                    fontWeight: 700,
                    color: "#051C4A",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <IconEye />
                  Request details
                </span>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6A84B0" }}>
                  {permintaanRequestIdLabel(selected.requestSequence, selected.tanggal_permintaan)}
                  {" · "}
                  {selected.nama_produk}
                </p>
              </div>
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

                <div className="pq-detail-dialog__body">
              <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#6A84B0", lineHeight: 1.45 }}>
                Review-only summary. To set price and expedition, use{" "}
                <strong style={{ color: "#051C4A" }}>Send Quotation</strong> from the table.
              </p>

              <section style={{ marginBottom: "18px" }}>
                <h3 className="pq-detail-section-title">Buyer</h3>
                <dl className="pq-detail-dl">
                  <div>
                    <dt>Name</dt>
                    <dd>{selected.nama}</dd>
                  </div>
                  <div>
                    <dt>Institution</dt>
                    <dd>{selected.instansi}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selected.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{selected.no_telepon}</dd>
                  </div>
                  <div>
                    <dt>Country</dt>
                    <dd>{selected.negara}</dd>
                  </div>
                </dl>
              </section>

              <section style={{ marginBottom: "18px" }}>
                <h3 className="pq-detail-section-title">Order</h3>
                <dl className="pq-detail-dl">
                  <div>
                    <dt>Product</dt>
                    <dd>{selected.nama_produk}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>
                      {selected.jumlah_permintaan} {selected.satuan}
                    </dd>
                  </div>
                  <div>
                    <dt>Indicative unit price</dt>
                    <dd>
                      {selected.unitPriceLabel} /{selected.satuan}
                    </dd>
                  </div>
                  <div>
                    <dt>Est. total</dt>
                    <dd>{selected.estimatedTotalLabel}</dd>
                  </div>
                  <div>
                    <dt>Requested</dt>
                    <dd>
                      {new Date(selected.tanggal_permintaan).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="pq-detail-section-title">Delivery</h3>
                <p className="pq-detail-block">{selected.alamat_tujuan}</p>
                {selected.detail_permintaan.trim() ? (
                  <>
                    <h3 className="pq-detail-section-title" style={{ marginTop: "14px" }}>
                      Notes
                    </h3>
                    <p className="pq-detail-block">{selected.detail_permintaan}</p>
                  </>
                ) : null}
              </section>
                </div>

                <div className="pq-detail-dialog__footer">
                  <button type="button" className="acct-btn acct-btn--ghost" onClick={() => setSelected(null)}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="acct-btn acct-btn--primary"
                    onClick={() => {
                      setSendTarget(selected);
                      setSelected(null);
                    }}
                  >
                    <IconQuotation />
                    Send quotation
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {selectedRejected
        ? createPortal(
            <div
              className="overlay-anim pq-detail-overlay"
              role="presentation"
              onClick={() => setSelectedRejected(null)}
            >
              <div
                className="overlay-anim pq-detail-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pq-rejected-title"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="pq-detail-dialog__header">
                  <div>
                    <span
                      id="pq-rejected-title"
                      style={{
                        fontWeight: 700,
                        color: "#051C4A",
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <IconEye />
                      Rejected quotation
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6A84B0" }}>
                      {permintaanRequestIdLabel(
                        selectedRejected.requestSequence,
                        selectedRejected.tanggal_permintaan
                      )}
                      {" · "}
                      {selectedRejected.nama_produk}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRejected(null)}
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

                <div className="pq-detail-dialog__body">
                  <section style={{ marginBottom: "18px" }}>
                    <h3 className="pq-detail-section-title">Quotation (declined)</h3>
                    <dl className="pq-detail-dl">
                      <div>
                        <dt>Unit price</dt>
                        <dd>
                          {selectedRejected.quotationUnitPriceLabel} /{selectedRejected.satuan}
                        </dd>
                      </div>
                      <div>
                        <dt>Shipping</dt>
                        <dd>{selectedRejected.shippingLabel}</dd>
                      </div>
                      <div>
                        <dt>Expedition</dt>
                        <dd>{selectedRejected.expedition || "—"}</dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd>{selectedRejected.totalQuotationLabel}</dd>
                      </div>
                    </dl>
                  </section>

                  <section style={{ marginBottom: "18px" }}>
                    <h3 className="pq-detail-section-title">Buyer</h3>
                    <dl className="pq-detail-dl">
                      <div>
                        <dt>Name</dt>
                        <dd>{selectedRejected.nama}</dd>
                      </div>
                      <div>
                        <dt>Institution</dt>
                        <dd>{selectedRejected.instansi}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{selectedRejected.email}</dd>
                      </div>
                    </dl>
                  </section>

                  <section>
                    <h3 className="pq-detail-section-title">Delivery</h3>
                    <p className="pq-detail-block">{selectedRejected.alamat_tujuan}</p>
                  </section>
                </div>

                <div className="pq-detail-dialog__footer">
                  <button
                    type="button"
                    className="acct-btn acct-btn--ghost"
                    onClick={() => setSelectedRejected(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {sendTarget ? (
        <SendQuotationModal
          row={sendTarget}
          onClose={() => setSendTarget(null)}
          onSent={onSendQuotation}
        />
      ) : null}

      <style>{`
        .pq-requests-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .pq-requests-table {
          width: 100%;
          min-width: 920px;
          table-layout: fixed;
        }
        .pq-requests-table col.col-stock {
          width: 84px;
        }
        .pq-requests-table col.col-price {
          width: 148px;
        }
        .pq-requests-table .pq-cell-text {
          white-space: normal;
          word-break: break-word;
          overflow: visible;
          text-overflow: unset;
        }
        .pq-requests-table .pq-cell-nowrap {
          white-space: nowrap;
          overflow: visible;
          text-overflow: unset;
        }
        .pq-total-hint {
          display: block;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #9aa8c7;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .pq-rejected-card {
          margin-top: 20px;
          background: #fff;
          border: 2px solid #fecdd3;
          box-shadow: 0 4px 16px rgba(10, 40, 120, 0.06);
        }
        .pq-rejected-toggle {
          width: 100%;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          text-align: left;
        }
        .pq-rejected-toggle:hover {
          background: #fff1f2;
        }
        .pq-rejected-toggle__meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #6a84b0;
          font-size: 13px;
          font-weight: 600;
        }
        .pq-rejected-toggle__label {
          user-select: none;
        }
        .pq-rejected-chevron {
          display: inline-flex;
          transition: transform 0.2s ease;
        }
        .pq-rejected-chevron.is-open {
          transform: rotate(180deg);
        }
        .pq-rejected-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 7px;
          border-radius: 999px;
          background: #fee2e2;
          color: #991b1b;
          font-size: 12px;
          font-weight: 700;
        }
        .pq-rejected-toggle[aria-expanded="true"] {
          border-bottom: 1px solid #fecdd3;
        }
        .pq-detail-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(5, 28, 74, 0.4);
          backdrop-filter: blur(3px);
          overflow-y: auto;
          display: flex;
          justify-content: center;
          padding: max(24px, env(safe-area-inset-top, 0px)) 16px 32px;
          box-sizing: border-box;
          font-family: "Plus Jakarta Sans", sans-serif;
        }
        .pq-detail-dialog {
          margin: auto;
          width: min(920px, calc(100vw - 32px));
          max-height: min(92vh, 860px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #d0deff;
          box-shadow: 0 20px 50px rgba(10, 40, 120, 0.22);
        }
        .pq-detail-dialog__header {
          flex-shrink: 0;
          padding: 14px 18px;
          border-bottom: 1px solid #edf2ff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f7faff;
        }
        .pq-detail-dialog__body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .pq-detail-dialog__footer {
          flex-shrink: 0;
          padding: 14px 18px 18px;
          border-top: 1px solid #edf2ff;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          background: #fff;
        }
        .pq-detail-section-title {
          margin: 0 0 10px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0b47b8;
        }
        .pq-detail-dl {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 20px;
          margin: 0;
        }
        .pq-detail-dl dt {
          margin: 0 0 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6a84b0;
        }
        .pq-detail-dl dd {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
          color: #1a3566;
          line-height: 1.4;
        }
        .pq-detail-block {
          margin: 0;
          padding: 12px 14px;
          background: #f7faff;
          border: 1px solid #edf2ff;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          color: #1a3566;
        }
        @media (max-width: 768px) {
          .pq-requests-table-wrap {
            overflow-x: visible;
          }
          .pq-requests-table {
            display: block;
            width: 100%;
            min-width: 0;
            table-layout: auto;
          }
          .pq-requests-table colgroup {
            display: none;
          }
          .pq-requests-table thead {
            display: none;
          }
          .pq-requests-table tbody {
            display: block;
          }
          .pq-requests-table tbody tr {
            display: block;
            width: 100%;
            padding: 14px 16px;
            border-top: 1px solid #edf2ff;
            box-sizing: border-box;
          }
          .pq-requests-table tbody tr:first-child {
            border-top: none;
          }
          .pq-requests-table tbody td {
            display: block;
            width: 100% !important;
            max-width: 100%;
            padding: 8px 0;
            border: none;
            text-align: left;
            box-sizing: border-box;
          }
          .pq-requests-table tbody td::before {
            content: attr(data-label);
            display: block;
            margin-bottom: 4px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #6a84b0;
            text-align: left;
          }
          .pq-requests-table tbody td > * {
            max-width: 100%;
          }
          .pq-requests-table .pq-cell-text,
          .pq-requests-table .pq-cell-nowrap {
            white-space: normal;
            word-break: normal;
            overflow: visible;
            text-overflow: unset;
          }
          .pq-requests-table tbody td.pq-cell-actions {
            display: block;
            padding-top: 12px;
          }
          .pq-requests-table tbody td.pq-cell-actions::before {
            display: none;
          }
          .pq-requests-table .acct-btn-group {
            width: 100%;
          }
          .pq-total-hint {
            display: inline;
            margin-right: 4px;
          }
          .pq-rejected-toggle {
            flex-wrap: wrap;
            gap: 8px;
          }
          .pq-detail-dialog {
            width: calc(100vw - 24px);
            max-height: calc(100dvh - 24px);
          }
          .pq-detail-dialog__body {
            padding: 16px;
          }
          .pq-detail-dialog__footer {
            flex-direction: column-reverse;
          }
          .pq-detail-dialog__footer .acct-btn {
            width: 100%;
            justify-content: center;
          }
        }
        @media (max-width: 640px) {
          .pq-detail-dl { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
