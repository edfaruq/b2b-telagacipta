"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { InvoiceViewModal } from "@/components/buyer/InvoiceViewModal";
import { PayInvoiceModal } from "@/components/buyer/PayInvoiceModal";
import { ReceiptViewModal } from "@/components/buyer/ReceiptViewModal";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { permintaanRequestIdLabel } from "@/lib/permintaan-request-id";
import { invoiceStatusStyle } from "@/lib/invoice-status";

const myQuotationAnimStyles = `
  @keyframes mqPageIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes mqCardIn {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes mqShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .mq-wrap {
    animation: mqPageIn 0.45s ease-out both;
  }
  .mq-header {
    animation: mqPageIn 0.42s ease-out both;
  }
  .mq-error,
  .mq-action-msg {
    animation: mqPageIn 0.3s ease-out both;
  }
  .mq-empty {
    animation: mqCardIn 0.45s 0.08s ease-out both;
  }
  .mq-card {
    opacity: 0;
    animation: mqCardIn 0.42s ease-out forwards;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .mq-card:hover {
    border-color: #8eb0ff;
    box-shadow: 0 10px 28px rgba(10, 40, 120, 0.1);
    transform: translateY(-2px);
  }
  .mq-card--skeleton {
    opacity: 1;
    animation: mqCardIn 0.42s ease-out both;
    pointer-events: none;
  }
  .mq-card--skeleton:hover {
    transform: none;
    border-color: #d0deff;
    box-shadow: 0 4px 16px rgba(10, 40, 120, 0.06);
  }
  .mq-skeleton-block {
    background: linear-gradient(90deg, #e6edf9 0%, #f5f8ff 45%, #e6edf9 90%);
    background-size: 200% 100%;
    animation: mqShimmer 1.35s ease-in-out infinite;
    border-radius: 10px;
  }
  .mq-skeleton-thumb {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    flex-shrink: 0;
  }
  .mq-skeleton-pill {
    width: 72px;
    height: 30px;
    border-radius: 999px;
  }
  .mq-link-btn,
  .mq-pay-btn,
  .mq-invoice-btn,
  .mq-receipt-btn {
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
  }
  .mq-link-btn:hover,
  .mq-pay-btn:hover,
  .mq-invoice-btn:hover,
  .mq-receipt-btn:hover {
    transform: translateY(-1px);
  }
  .mq-link-btn:hover {
    box-shadow: 0 6px 16px rgba(11, 71, 184, 0.28);
  }
  @media (prefers-reduced-motion: reduce) {
    .mq-wrap,
    .mq-header,
    .mq-error,
    .mq-action-msg,
    .mq-empty,
    .mq-card {
      animation: none;
      opacity: 1;
      transform: none;
    }
    .mq-card:hover { transform: none; }
    .mq-skeleton-block { animation: none; background: #e6edf9; }
    .mq-link-btn:hover,
    .mq-pay-btn:hover,
    .mq-invoice-btn:hover,
    .mq-receipt-btn:hover { transform: none; }
  }
`;

function MyQuotationLoadingSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="mq-list" aria-busy="true" aria-live="polite" aria-label="Loading quotations">
      {Array.from({ length: count }, (_, index) => (
        <article
          key={index}
          className="mq-card mq-card--skeleton"
          style={{ animationDelay: `${index * 90 + 60}ms` }}
        >
          <div className="mq-card-top">
            <div className="mq-product">
              <div className="mq-skeleton-block mq-skeleton-thumb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="mq-skeleton-block"
                  style={{ height: 24, width: "55%", marginBottom: 10 }}
                />
                <div
                  className="mq-skeleton-block"
                  style={{ height: 14, width: "30%", marginBottom: 8 }}
                />
                <div className="mq-skeleton-block" style={{ height: 14, width: "45%" }} />
              </div>
            </div>
            <div className="mq-skeleton-block mq-skeleton-pill" />
          </div>
          <div className="mq-offer-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}>
                <div className="mq-skeleton-block" style={{ height: 10, width: 56, marginBottom: 8 }} />
                <div className="mq-skeleton-block" style={{ height: 18, width: "80%" }} />
              </div>
            ))}
          </div>
          <div
            className="mq-invoice-bar"
            style={{ marginTop: 0, pointerEvents: "none" }}
          >
            <div style={{ flex: 1 }}>
              <div className="mq-skeleton-block" style={{ height: 10, width: 48, marginBottom: 8 }} />
              <div className="mq-skeleton-block" style={{ height: 16, width: "40%", marginBottom: 6 }} />
              <div className="mq-skeleton-block" style={{ height: 14, width: "28%" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div className="mq-skeleton-block" style={{ width: 88, height: 40, borderRadius: 999 }} />
              <div className="mq-skeleton-block" style={{ width: 88, height: 40, borderRadius: 999 }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

type QuotationInvoice = {
  id: number;
  number: string;
  totalLabel: string;
  status: string;
  statusLabel: string;
  issuedAt: string;
  canPay: boolean;
  canDownloadPdf: boolean;
  paymentPending: boolean;
  paymentRejected: boolean;
  paymentRejectedMessage: string | null;
  paymentStatusLabel: string | null;
  receipt: { id: number; number: string } | null;
};

type AcceptedQuotation = {
  id: number;
  requestSequence: number;
  productName: string;
  productSlug: string;
  productImage: string;
  quantity: number;
  unit: string;
  deliveryAddress: string;
  requestedAt: string;
  acceptedAt: string;
  offer: {
    unitPriceLabel: string;
    shippingLabel: string;
    expedition: string;
    subtotalLabel: string;
    totalLabel: string;
  };
  invoice: QuotationInvoice | null;
};

export function BuyerMyQuotationPanel() {
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<AcceptedQuotation[]>([]);
  const [error, setError] = useState("");
  const [invoiceModalId, setInvoiceModalId] = useState<number | null>(null);
  const [payInvoice, setPayInvoice] = useState<QuotationInvoice | null>(null);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const loadQuotations = async () => {
    const res = await fetch("/api/my-quotations", { cache: "no-store" });
    const data = (await res.json()) as {
      quotations?: AcceptedQuotation[];
      message?: string;
    };
    if (!res.ok) {
      throw new Error(data.message ?? "Failed to load quotations.");
    }
    setQuotations(data.quotations ?? []);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadQuotations();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not reach the server.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="mq-panel">
        <div className="mq-wrap">
          <header className="mq-header">
            <h1 className="mq-title">My Quotation</h1>
            <p className="mq-subtitle">
              Accepted quotations and invoices from Telagacipta.
            </p>
          </header>

          {error ? (
            <div style={alertFailBanner} className="mq-error">
              {error}
            </div>
          ) : null}

          {actionMessage && !error ? (
            <p className="mq-action-msg">{actionMessage}</p>
          ) : null}

          {loading ? (
            <MyQuotationLoadingSkeleton count={2} />
          ) : quotations.length === 0 ? (
            <div className="mq-empty">
              <p>No accepted quotations yet.</p>
              <Link href="/account/quotations" className="mq-link-btn">
                View my requests
              </Link>
            </div>
          ) : (
            <div className="mq-list">
              {quotations.map((item, index) => {
              const qtyLabel = Number.isInteger(item.quantity)
                ? String(item.quantity)
                : item.quantity.toLocaleString("id-ID");
              const invStyle = item.invoice
                ? invoiceStatusStyle(item.invoice.status)
                : null;

              return (
                <article
                  key={item.id}
                  className="mq-card"
                  style={{ animationDelay: `${Math.min(index, 10) * 70 + 80}ms` }}
                >
                  <div className="mq-card-top">
                    <div className="mq-product">
                      <div className="mq-thumb">
                        <Image
                          src={item.productImage}
                          alt=""
                          width={80}
                          height={80}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                      </div>
                      <div>
                        <Link href={`/products/${item.productSlug}`} className="mq-product-name">
                          {item.productName}
                        </Link>
                        <p className="mq-id">
                          {permintaanRequestIdLabel(item.requestSequence, item.requestedAt)}
                        </p>
                        <p className="mq-date">
                          Accepted{" "}
                          {new Date(item.acceptedAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    {item.invoice && invStyle ? (
                      <span
                        className="mq-inv-status"
                        style={{
                          background: invStyle.background,
                          color: invStyle.color,
                          border: invStyle.border,
                        }}
                      >
                        {item.invoice.statusLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="mq-offer-grid">
                    <div>
                      <span className="mq-label">Quantity</span>
                      <p className="mq-value">
                        {qtyLabel} {item.unit}
                      </p>
                    </div>
                    <div>
                      <span className="mq-label">Unit price</span>
                      <p className="mq-value">{item.offer.unitPriceLabel}</p>
                    </div>
                    <div>
                      <span className="mq-label">Expedition</span>
                      <p className="mq-value">{item.offer.expedition || "—"}</p>
                    </div>
                    <div>
                      <span className="mq-label">Total</span>
                      <p className="mq-value mq-total">{item.offer.totalLabel}</p>
                    </div>
                  </div>

                  {item.invoice?.paymentRejected && item.invoice.paymentRejectedMessage ? (
                    <div className="mq-pay-rejected" role="alert">
                      <p className="mq-pay-rejected-title">Payment not validated</p>
                      <p className="mq-pay-rejected-text">{item.invoice.paymentRejectedMessage}</p>
                    </div>
                  ) : null}

                  {item.invoice ? (
                    <div className="mq-invoice-bar">
                      <div>
                        <span className="mq-label">Invoice</span>
                        <p className="mq-inv-number">{item.invoice.number}</p>
                        <p className="mq-inv-total">{item.invoice.totalLabel}</p>
                        {item.invoice.paymentPending ? (
                          <p className="mq-pay-pending">{item.invoice.paymentStatusLabel}</p>
                        ) : null}
                      </div>
                      <div className="mq-invoice-actions">
                        {item.invoice.canPay ? (
                          <button
                            type="button"
                            className="mq-pay-btn"
                            onClick={() => setPayInvoice(item.invoice)}
                          >
                            {item.invoice.paymentRejected ? "Pay again" : "Pay"}
                          </button>
                        ) : null}
                        <div className="mq-doc-btns">
                          {item.invoice.receipt ? (
                            <button
                              type="button"
                              className="mq-receipt-btn"
                              onClick={() => setReceiptInvoiceId(item.invoice!.id)}
                            >
                              Receipt
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="mq-invoice-btn"
                            onClick={() => setInvoiceModalId(item.invoice!.id)}
                          >
                            Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mq-muted">Invoice is being prepared…</p>
                  )}
                </article>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {invoiceModalId ? (
        <InvoiceViewModal
          invoiceId={invoiceModalId}
          onClose={() => setInvoiceModalId(null)}
          onPayAgain={() => {
            const match = quotations.find((q) => q.invoice?.id === invoiceModalId)?.invoice;
            if (match) {
              setInvoiceModalId(null);
              setPayInvoice(match);
            }
          }}
        />
      ) : null}

      {receiptInvoiceId ? (
        <ReceiptViewModal
          invoiceId={receiptInvoiceId}
          onClose={() => setReceiptInvoiceId(null)}
        />
      ) : null}

      {payInvoice ? (
        <PayInvoiceModal
          invoiceId={payInvoice.id}
          invoiceNumber={payInvoice.number}
          totalLabel={payInvoice.totalLabel}
          onClose={() => setPayInvoice(null)}
          onSubmitted={async () => {
            setActionMessage("Payment proof submitted. Waiting for admin validation.");
            await loadQuotations();
          }}
        />
      ) : null}

      <style>{myQuotationAnimStyles}</style>
      <style>{`
        .mq-panel {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1f2937;
        }
        .mq-header { margin-bottom: 28px; }
        .mq-title {
          margin: 0 0 8px;
          font-size: 32px;
          color: #051c4a;
        }
        .mq-subtitle {
          margin: 0;
          font-size: 17px;
          color: #6a84b0;
        }
        .mq-error { margin-bottom: 18px; font-size: 14px; }
        .mq-action-msg {
          margin: 0 0 18px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 14px;
        }
        .mq-pay-pending {
          margin: 6px 0 0;
          font-size: 13px;
          color: #92400e;
          font-weight: 600;
        }
        .mq-pay-rejected {
          margin-bottom: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .mq-pay-rejected-title {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 700;
          color: #991b1b;
        }
        .mq-pay-rejected-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #b91c1c;
        }
        .mq-invoice-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .mq-doc-btns {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
        }
        .mq-pay-btn {
          border: none;
          border-radius: 999px;
          padding: 10px 22px;
          background: #16a34a;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .mq-pay-btn:hover { background: #15803d; }
        .mq-muted { color: #6a84b0; font-size: 15px; }
        .mq-empty {
          border: 1px dashed #c9dcff;
          border-radius: 16px;
          background: #fff;
          padding: 40px 24px;
          text-align: center;
          color: #6a84b0;
        }
        .mq-link-btn {
          display: inline-block;
          margin-top: 12px;
          padding: 10px 20px;
          border-radius: 999px;
          background: #0b47b8;
          color: #fff;
          text-decoration: none;
          font-weight: 600;
        }
        .mq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mq-card {
          background: #fff;
          border: 1px solid #d0deff;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 4px 16px rgba(10, 40, 120, 0.06);
        }
        .mq-card-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }
        .mq-product {
          display: flex;
          gap: 14px;
          min-width: 0;
        }
        .mq-thumb {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          background: #e5e7eb;
          flex-shrink: 0;
        }
        .mq-product-name {
          font-size: 20px;
          font-weight: 700;
          color: #051c4a;
          text-decoration: none;
        }
        .mq-product-name:hover { color: #0b47b8; }
        .mq-id, .mq-date {
          margin: 4px 0 0;
          font-size: 14px;
          color: #6a84b0;
        }
        .mq-inv-status {
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          height: fit-content;
        }
        .mq-offer-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        .mq-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6a84b0;
          margin-bottom: 4px;
        }
        .mq-value {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a3566;
        }
        .mq-total { color: #051c4a; font-size: 18px; }
        .mq-invoice-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          background: #f7faff;
          border: 1px solid #c9dcff;
          border-radius: 12px;
        }
        .mq-inv-number {
          margin: 4px 0 0;
          font-size: 16px;
          font-weight: 700;
          color: #051c4a;
        }
        .mq-inv-total {
          margin: 2px 0 0;
          font-size: 14px;
          color: #6a84b0;
        }
        .mq-invoice-btn {
          border: none;
          border-radius: 999px;
          padding: 10px 22px;
          background: #0b47b8;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          flex-shrink: 0;
        }
        .mq-invoice-btn:hover {
          background: #093a9a;
        }
        .mq-receipt-btn {
          border: 1px solid #c9dcff;
          border-radius: 999px;
          padding: 10px 22px;
          background: #fff;
          color: #051c4a;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          flex-shrink: 0;
        }
        .mq-receipt-btn:hover {
          background: #f7faff;
          border-color: #0b47b8;
          color: #0b47b8;
        }
        @media (max-width: 760px) {
          .mq-offer-grid { grid-template-columns: 1fr 1fr; }
          .mq-card-top { flex-direction: column; }
          .mq-invoice-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .mq-invoice-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
}
