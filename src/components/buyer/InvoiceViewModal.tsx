"use client";

import { useEffect, useState } from "react";
import { buyerModalAnimStyles } from "@/lib/buyer-modal-anim";
import { invoiceStatusStyle } from "@/lib/invoice-status";

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v12m0 0l4-4m-4 4L8 11M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type InvoiceDetail = {
  id: number;
  number: string;
  numberLabel: string;
  issuedAtLabel: string;
  dueAtLabel?: string;
  totalLabel: string;
  status: string;
  statusLabel: string;
  requestIdLabel: string;
  buyer: {
    name: string;
    email: string;
    institution: string;
    phone: string;
  };
  billToLines: string[];
  productName: string;
  quantity: number;
  unit: string;
  lines: {
    unitPrice: string;
    quantity: string;
    subtotal: string;
    shipping: string;
    expedition: string;
    total: string;
  };
  canDownloadPdf: boolean;
  canPay?: boolean;
  paymentPending?: boolean;
  paymentRejected?: boolean;
  paymentRejectedMessage?: string | null;
  paymentMethodLabel?: string | null;
};

type Props = {
  invoiceId: number;
  onClose: () => void;
  onPayAgain?: () => void;
};

export function InvoiceViewModal({ invoiceId, onClose, onPayAgain }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" });
        const data = (await res.json()) as { invoice?: InvoiceDetail; message?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.message ?? "Failed to load invoice.");
          setInvoice(null);
          return;
        }
        setInvoice(data.invoice ?? null);
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  const openInvoicePdf = async () => {
    if (!invoice?.canDownloadPdf) return;
    setDownloadError("");
    setDownloading(true);
    const previewTab = window.open("about:blank", "_blank");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { cache: "no-store" });
      if (!res.ok) {
        previewTab?.close();
        const data = (await res.json()) as { message?: string };
        setDownloadError(data.message ?? "Could not open PDF.");
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
      setDownloadError("Could not open PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const statusStyle = invoice ? invoiceStatusStyle(invoice.status) : null;

  return (
    <div className="inv-overlay buyer-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="inv-modal buyer-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="inv-modal-head">
          <div>
            <h2 className="inv-modal-title">Invoice</h2>
            {invoice ? <p className="inv-modal-sub">{invoice.numberLabel}</p> : null}
          </div>
          <button type="button" className="inv-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="inv-modal-body">
          {loading ? (
            <p className="inv-muted">Loading invoice…</p>
          ) : error ? (
            <p className="inv-error">{error}</p>
          ) : invoice ? (
            <>
              <div className="inv-meta-row">
                <span
                  className="inv-status-pill"
                  style={{
                    background: statusStyle!.background,
                    color: statusStyle!.color,
                    border: statusStyle!.border,
                  }}
                >
                  {invoice.statusLabel}
                </span>
                <span className="inv-muted">{invoice.issuedAtLabel}</span>
              </div>

              {invoice.paymentRejected && invoice.paymentRejectedMessage ? (
                <div className="inv-rejected-msg" role="alert">
                  <p className="inv-rejected-title">Payment not validated</p>
                  <p className="inv-rejected-text">{invoice.paymentRejectedMessage}</p>
                </div>
              ) : null}

              {invoice.paymentPending ? (
                <p className="inv-pending-msg">
                  Payment proof submitted. We will validate your payment shortly.
                </p>
              ) : null}

              {!invoice.canDownloadPdf &&
              !invoice.paymentPending &&
              !invoice.paymentRejected ? (
                <p className="inv-pending-msg">
                  Pay this invoice and wait for validation. We will ship the order after payment is
                  verified.
                </p>
              ) : null}

              <div className="inv-grid">
                {invoice.paymentMethodLabel ? (
                  <div className="inv-field inv-field--full">
                    <span className="inv-label">Payment method</span>
                    <p className="inv-value">{invoice.paymentMethodLabel}</p>
                  </div>
                ) : null}
                <div className="inv-field">
                  <span className="inv-label">Request</span>
                  <p className="inv-value">{invoice.requestIdLabel}</p>
                </div>
                <div className="inv-field">
                  <span className="inv-label">Product</span>
                  <p className="inv-value">{invoice.productName}</p>
                </div>
                {invoice.dueAtLabel ? (
                  <div className="inv-field">
                    <span className="inv-label">Date due</span>
                    <p className="inv-value">{invoice.dueAtLabel}</p>
                  </div>
                ) : null}
              </div>

              <div className="inv-field inv-bill-to">
                <span className="inv-label">Bill to</span>
                {invoice.billToLines.map((line) => (
                  <p key={line} className="inv-value">
                    {line}
                  </p>
                ))}
              </div>

              <div className="inv-lines">
                <div className="inv-line">
                  <span>Unit price</span>
                  <strong>{invoice.lines.unitPrice}</strong>
                </div>
                <div className="inv-line">
                  <span>Quantity</span>
                  <strong>{invoice.lines.quantity}</strong>
                </div>
                <div className="inv-line">
                  <span>Subtotal</span>
                  <strong>{invoice.lines.subtotal}</strong>
                </div>
                <div className="inv-line">
                  <span>Expedition</span>
                  <strong>{invoice.lines.expedition || "—"}</strong>
                </div>
                <div className="inv-line">
                  <span>Shipping</span>
                  <strong>{invoice.lines.shipping}</strong>
                </div>
                <div className="inv-line inv-line-total">
                  <span>Amount due</span>
                  <strong>{invoice.totalLabel}</strong>
                </div>
              </div>

              {downloadError ? <p className="inv-error">{downloadError}</p> : null}
            </>
          ) : null}
        </div>

        <div className="inv-modal-foot">
          {invoice?.canPay && onPayAgain ? (
            <button type="button" className="inv-btn-pay" onClick={onPayAgain}>
              {invoice.paymentRejected ? "Re-upload Payment Proof" : "Pay"}
            </button>
          ) : null}
          {invoice?.canDownloadPdf ? (
            <button
              type="button"
              className="inv-btn-download"
              onClick={() => void openInvoicePdf()}
              disabled={downloading}
            >
              {!downloading ? <IconDownload /> : null}
              <span>{downloading ? "Preparing…" : "View Invoice"}</span>
            </button>
          ) : null}
        </div>
      </div>

      <style>{buyerModalAnimStyles}</style>
      <style>{`
        .inv-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 28, 74, 0.4);
          backdrop-filter: blur(3px);
          display: grid;
          place-items: center;
          z-index: 80;
          padding: 16px;
        }
        .inv-modal {
          width: min(640px, 100%);
          max-height: min(90vh, 800px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #d0deff;
          box-shadow: 0 20px 50px rgba(10, 40, 120, 0.22);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .inv-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px;
          border-bottom: 1px solid #edf2ff;
          background: #f7faff;
        }
        .inv-modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #051c4a;
        }
        .inv-modal-sub {
          margin: 4px 0 0;
          font-size: 14px;
          color: #6a84b0;
        }
        .inv-close {
          border: 1px solid #d0deff;
          background: #fff;
          color: #6a84b0;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }
        .inv-modal-body {
          padding: 26px 28px 28px;
          overflow-y: auto;
        }
        .inv-modal-foot {
          padding: 20px 26px 24px;
          border-top: 1px solid #edf2ff;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: center;
          gap: 14px;
          background: #fafcff;
        }
        .inv-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .inv-pending-msg {
          margin: 0 0 20px;
          padding: 12px 16px;
          border-radius: 8px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          font-size: 13px;
          line-height: 1.45;
        }
        .inv-rejected-msg {
          margin: 0 0 20px;
          padding: 14px 16px;
          border-radius: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .inv-rejected-title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: #991b1b;
        }
        .inv-rejected-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #b91c1c;
        }
        .inv-status-pill {
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 13px;
          font-weight: 700;
        }
        .inv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px 28px;
          margin-bottom: 28px;
        }
        .inv-field--full {
          grid-column: 1 / -1;
          padding-bottom: 6px;
          margin-bottom: 4px;
          border-bottom: 1px solid #edf2ff;
        }
        .inv-bill-to {
          margin-bottom: 28px;
        }
        .inv-bill-to .inv-value {
          margin: 0 0 8px;
          line-height: 1.55;
        }
        .inv-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6a84b0;
          margin-bottom: 10px;
        }
        .inv-value {
          margin: 0;
          font-size: 15px;
          color: #1a3566;
          font-weight: 500;
          line-height: 1.45;
        }
        .inv-muted { color: #6a84b0; font-size: 14px; }
        .inv-error {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 10px 12px;
          border-radius: 8px;
          margin: 0 0 12px;
          font-size: 13px;
        }
        .inv-lines {
          background: #f7faff;
          border: 1px solid #edf2ff;
          border-radius: 12px;
          padding: 18px 20px;
        }
        .inv-line {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 0;
          font-size: 14px;
          color: #4a6490;
        }
        .inv-line strong { color: #051c4a; font-weight: 600; }
        .inv-line-total {
          margin-top: 12px;
          padding-top: 16px;
          border-top: 1px solid #d0deff;
        }
        .inv-line-total strong { font-size: 18px; color: #0b47b8; }
        .inv-btn-download, .inv-btn-pay {
          border-radius: 999px;
          padding: 12px 28px;
          min-height: 44px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }
        .inv-btn-pay {
          border: none;
          background: #16a34a;
          color: #fff;
        }
        .inv-btn-download {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
          background: #051c4a;
          color: #fff;
        }
        .inv-btn-download:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 560px) {
          .inv-grid { grid-template-columns: 1fr; }
          .inv-modal-head,
          .inv-modal-body,
          .inv-modal-foot {
            padding-left: 20px;
            padding-right: 20px;
          }
          .inv-modal-foot {
            justify-content: stretch;
          }
          .inv-btn-download,
          .inv-btn-pay {
            flex: 1;
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
}
