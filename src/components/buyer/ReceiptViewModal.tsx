"use client";

import { useEffect, useState } from "react";
import { buyerModalAnimStyles } from "@/lib/buyer-modal-anim";

export type ReceiptDetail = {
  sellerName: string;
  amountLabel: string;
  paidAtLabel: string;
  receiptNumber: string;
  invoiceNumber: string;
  paymentMethod: string;
  accountDisplay: string | null;
};

type Props = {
  invoiceId: number;
  onClose: () => void;
};

function IconReceipt() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="#c9dcff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6M8 13h8M8 17h5"
        stroke="#c9dcff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReceiptViewModal({ invoiceId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/receipt`, { cache: "no-store" });
        const data = (await res.json()) as { receipt?: ReceiptDetail; message?: string };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.message ?? "Failed to load receipt.");
          return;
        }
        setReceipt(data.receipt ?? null);
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

  return (
    <div className="rcp-overlay buyer-modal-overlay" onClick={onClose}>
      <div className="rcp-modal buyer-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rcp-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {loading ? (
          <p className="rcp-muted">Loading receipt…</p>
        ) : error ? (
          <p className="rcp-error">{error}</p>
        ) : receipt ? (
          <div className="rcp-card">
            <div className="rcp-card-top">
              <div>
                <p className="rcp-from">Receipt from {receipt.sellerName}</p>
                <p className="rcp-amount">{receipt.amountLabel}</p>
                <p className="rcp-paid">Paid {receipt.paidAtLabel}</p>
              </div>
              <IconReceipt />
            </div>

            <hr className="rcp-divider" />

            <dl className="rcp-details">
              <div className="rcp-row">
                <dt>Receipt number</dt>
                <dd>{receipt.receiptNumber}</dd>
              </div>
              <div className="rcp-row">
                <dt>Invoice number</dt>
                <dd>{receipt.invoiceNumber}</dd>
              </div>
              <div className="rcp-row">
                <dt>Payment method</dt>
                <dd className="rcp-method">{receipt.paymentMethod}</dd>
              </div>
              {receipt.accountDisplay ? (
                <div className="rcp-row">
                  <dt>Account</dt>
                  <dd className="rcp-method">{receipt.accountDisplay}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>

      <style>{buyerModalAnimStyles}</style>
      <style>{`
        .rcp-overlay {
          position: fixed;
          inset: 0;
          z-index: 86;
          background: rgba(5, 28, 74, 0.4);
          backdrop-filter: blur(3px);
          display: grid;
          place-items: center;
          padding: 16px;
        }
        .rcp-modal {
          position: relative;
          width: min(440px, 100%);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .rcp-close {
          position: absolute;
          top: -8px;
          right: 0;
          z-index: 2;
          width: 32px;
          height: 32px;
          border: 1px solid #d0deff;
          border-radius: 999px;
          background: #fff;
          color: #6a84b0;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }
        .rcp-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e8eeff;
          box-shadow: 0 12px 40px rgba(10, 40, 120, 0.12);
          padding: 28px 28px 24px;
        }
        .rcp-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .rcp-from {
          margin: 0 0 8px;
          font-size: 15px;
          color: #6a84b0;
        }
        .rcp-amount {
          margin: 0 0 6px;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #111827;
          line-height: 1.1;
        }
        .rcp-paid {
          margin: 0;
          font-size: 15px;
          color: #6a84b0;
        }
        .rcp-divider {
          margin: 22px 0;
          border: none;
          border-top: 1px solid #edf2ff;
        }
        .rcp-details {
          margin: 0;
        }
        .rcp-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          padding: 10px 0;
        }
        .rcp-row dt {
          margin: 0;
          font-size: 14px;
          color: #9aa8c7;
          font-weight: 500;
        }
        .rcp-row dd {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          text-align: right;
        }
        .rcp-method {
          color: #051c4a;
        }
        .rcp-muted, .rcp-error {
          background: #fff;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        .rcp-error {
          color: #991b1b;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
}
