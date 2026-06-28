"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { InvoiceViewModal } from "@/components/buyer/InvoiceViewModal";
import { OrderShippingFeedbackForm } from "@/components/buyer/OrderShippingFeedbackForm";
import { ShippingLiveStatus } from "@/components/buyer/ShippingLiveStatus";
import { PayInvoiceModal } from "@/components/buyer/PayInvoiceModal";
import { ReceiptViewModal } from "@/components/buyer/ReceiptViewModal";
import { StarRatingDisplay } from "@/components/shared/StarRating";
import { isBuyerOrderInHistory } from "@/lib/buyer-order-history";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { permintaanRequestIdLabel } from "@/lib/permintaan-request-id";
import { invoiceStatusStyle } from "@/lib/invoice-status";

const buyerOrdersAnimStyles = `
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

function BuyerOrdersLoadingSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="mq-list" aria-busy="true" aria-live="polite" aria-label="Loading orders">
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
  shipping: {
    id: number;
    status: string;
    statusLabel: string;
    trackingNumber: string | null;
    expedition: string;
    shippedAt: string | null;
    deliveredAt: string | null;
    rating: number | null;
    feedback: string | null;
    canConfirmReceived: boolean;
    canSubmitFeedback: boolean;
    canTrackShipment?: boolean;
  } | null;
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
  inOrderHistory: boolean;
};

type OrderViewTab = "active" | "history";

export function BuyerOrdersPanel() {
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<AcceptedQuotation[]>([]);
  const [orderTab, setOrderTab] = useState<OrderViewTab>("active");
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
      throw new Error(data.message ?? "Failed to load orders.");
    }
    setQuotations(data.quotations ?? []);
  };

  const handleFeedbackSuccess = async (message: string) => {
    setActionMessage(message);
    await loadQuotations();
    setOrderTab("history");
  };

  const activeOrders = quotations.filter((q) => !isBuyerOrderInHistory(q));
  const historyOrders = quotations.filter((q) => isBuyerOrderInHistory(q));
  const visibleOrders = orderTab === "active" ? activeOrders : historyOrders;

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
            <h1 className="mq-title">My Orders</h1>
            <p className="mq-subtitle">
              Track active orders or view completed orders after you submit a rating.
            </p>
          </header>

          {!loading && quotations.length > 0 ? (
            <div className="mq-tabs" role="tablist" aria-label="Orders">
              <button
                type="button"
                role="tab"
                aria-selected={orderTab === "active"}
                className={`mq-tab${orderTab === "active" ? " is-active" : ""}`}
                onClick={() => setOrderTab("active")}
              >
                Active orders
                <span
                  className={`mq-tab-badge${activeOrders.length === 0 ? " mq-tab-badge--empty" : ""}`}
                >
                  {activeOrders.length}
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={orderTab === "history"}
                className={`mq-tab${orderTab === "history" ? " is-active" : ""}`}
                onClick={() => setOrderTab("history")}
              >
                Order history
              </button>
            </div>
          ) : null}

          {error ? (
            <div style={alertFailBanner} className="mq-error">
              {error}
            </div>
          ) : null}

          {actionMessage && !error ? (
            <p className="mq-action-msg">{actionMessage}</p>
          ) : null}

          {loading ? (
            <BuyerOrdersLoadingSkeleton count={2} />
          ) : quotations.length === 0 ? (
            <div className="mq-empty">
              <p>No orders yet.</p>
              <Link href="/account/quotations" className="mq-link-btn">
                View my requests
              </Link>
            </div>
          ) : visibleOrders.length === 0 ? (
            <div className="mq-empty">
              <p>
                {orderTab === "active"
                  ? "No active orders. Completed orders are in Order history."
                  : "No completed orders yet. After delivery, submit your rating to move an order here."}
              </p>
              {orderTab === "history" && activeOrders.length > 0 ? (
                <button
                  type="button"
                  className="mq-link-btn"
                  style={{ border: "none", cursor: "pointer" }}
                  onClick={() => setOrderTab("active")}
                >
                  View active orders
                </button>
              ) : null}
            </div>
          ) : (
            <div className="mq-list">
              {visibleOrders.map((item, index) => {
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

                  {item.invoice?.shipping ? (
                    <div className="mq-shipping">
                      <div className="mq-shipping-head">
                        <span className="mq-label">Shipping</span>
                        <span
                          className={`mq-ship-badge mq-ship-badge--${item.invoice.shipping.status}`}
                        >
                          {item.invoice.shipping.statusLabel}
                        </span>
                      </div>
                      <p className="mq-ship-line">
                        <strong>Courier:</strong>{" "}
                        {item.invoice.shipping.expedition || item.offer.expedition || "—"}
                      </p>
                      {item.invoice.shipping.canTrackShipment &&
                      item.invoice.shipping.trackingNumber ? (
                        <ShippingLiveStatus
                          shipmentId={item.invoice.shipping.id}
                          trackingNumber={item.invoice.shipping.trackingNumber}
                          shipmentStatus={item.invoice.shipping.status}
                          shippedAt={item.invoice.shipping.shippedAt}
                          deliveredAt={item.invoice.shipping.deliveredAt}
                        />
                      ) : null}
                      {!item.invoice.shipping.trackingNumber &&
                      item.invoice.shipping.status === "diproses" ? (
                        <p className="mq-ship-muted">
                          Your order is being prepared. Tracking will appear once shipped.
                        </p>
                      ) : null}
                      {item.invoice.shipping.canConfirmReceived ? (
                        <OrderShippingFeedbackForm
                          invoiceId={item.invoice.id}
                          mode="confirm"
                          onSuccess={handleFeedbackSuccess}
                        />
                      ) : item.invoice.shipping.status === "diterima" ? (
                        <div className="mq-ship-done-block">
                          {item.invoice.shipping.canSubmitFeedback ? (
                            <OrderShippingFeedbackForm
                              invoiceId={item.invoice.id}
                              mode="rate-only"
                              onSuccess={handleFeedbackSuccess}
                            />
                          ) : (
                            <>
                              <p className="mq-ship-done">Delivery confirmed. Thank you!</p>
                              {item.invoice.shipping.rating != null &&
                              item.invoice.shipping.rating > 0 ? (
                                <div className="mq-ship-rating">
                                  <span className="mq-label" style={{ marginBottom: 6 }}>
                                    Your rating
                                  </span>
                                  <StarRatingDisplay
                                    value={item.invoice.shipping.rating}
                                    size={20}
                                  />
                                  {item.invoice.shipping.feedback ? (
                                    <p className="mq-ship-feedback">
                                      {item.invoice.shipping.feedback}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
            setActionMessage("Payment proof submitted. We will validate your payment shortly");
            await loadQuotations();
          }}
        />
      ) : null}

      <style>{buyerOrdersAnimStyles}</style>
      <style>{`
        .mq-panel {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1f2937;
        }
        .mq-header { margin-bottom: 20px; }
        .mq-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0 0 22px;
        }
        .mq-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #c9dcff;
          border-radius: 999px;
          padding: 9px 16px;
          background: #fff;
          color: #4a6490;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .mq-tab:hover {
          background: #f7faff;
          border-color: #0b47b8;
          color: #0b47b8;
        }
        .mq-tab.is-active {
          background: #0b47b8;
          border-color: #0b47b8;
          color: #fff;
        }
        .mq-tab-badge {
          min-width: 20px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          text-align: center;
        }
        .mq-tab:not(.is-active) .mq-tab-badge {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .mq-tab.is-active .mq-tab-badge {
          background: rgba(255, 255, 255, 0.22);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.35);
        }
        .mq-tab-badge--empty { display: none; }
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
          flex-wrap: wrap;
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
          min-width: 0;
        }
        .mq-invoice-bar > div:first-child {
          min-width: 0;
        }
        .mq-shipping {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #e2eaff;
          background: #fff;
        }
        .mq-shipping-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .mq-shipping-head .mq-label { margin-bottom: 0; }
        .mq-ship-badge {
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 700;
        }
        .mq-ship-badge--diproses {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .mq-ship-badge--dikirim {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        .mq-ship-badge--diterima {
          background: #ecfdf5;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        .mq-ship-line {
          margin: 0 0 6px;
          font-size: 14px;
          color: #4a6490;
          line-height: 1.45;
        }
        .mq-ship-line strong { color: #051c4a; }
        .mq-ship-tracking-block { margin-top: 4px; }
        .mq-ship-line--track {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .mq-track-number {
          font-family: ui-monospace, "Cascadia Code", monospace;
          font-size: 13px;
          color: #0b47b8;
          word-break: break-all;
        }
        .mq-copy-track-btn {
          border: 1px solid #d0deff;
          background: #fff;
          color: #0b47b8;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .mq-copy-track-btn:hover { background: #f7faff; }
        .mq-ship-muted {
          margin: 0 0 10px;
          font-size: 13px;
          color: #6a84b0;
          line-height: 1.45;
        }
        .mq-ship-done-block { margin-top: 8px; }
        .mq-feedback-form {
          margin-top: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #e2eaff;
          background: #f7faff;
        }
        .mq-feedback-title {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 700;
          color: #051c4a;
        }
        .mq-feedback-prompt {
          margin: 0 0 10px;
          font-size: 14px;
          color: #6a84b0;
          text-align: center;
        }
        .mq-feedback-label {
          display: block;
          margin: 14px 0 6px;
          font-size: 13px;
          font-weight: 600;
          color: #051c4a;
        }
        .mq-feedback-optional { font-weight: 500; color: #6a84b0; }
        .mq-feedback-textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #c9dcff;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 72px;
          color: #051c4a;
        }
        .mq-feedback-textarea:focus {
          outline: none;
          border-color: #0b47b8;
          box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.1);
        }
        .mq-feedback-count {
          margin: 4px 0 0;
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
        }
        .mq-feedback-error {
          margin: 10px 0 0;
          font-size: 13px;
          color: #b91c1c;
        }
        .mq-feedback-submit {
          margin-top: 12px;
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 11px 18px;
          background: #16a34a;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .mq-feedback-submit:hover { background: #15803d; }
        .mq-feedback-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .star-rating-input { justify-content: flex-start !important; }
        .mq-ship-done {
          margin: 0 0 10px;
          font-size: 14px;
          font-weight: 600;
          color: #15803d;
        }
        .mq-ship-rating { margin-top: 4px; }
        .mq-ship-feedback {
          margin: 8px 0 0;
          font-size: 13px;
          color: #4a6490;
          line-height: 1.45;
        }
        .mq-ship-track-btn {
          border: 1px solid #c9dcff;
          border-radius: 999px;
          padding: 6px 14px;
          background: #fff;
          color: #0b47b8;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
        }
        .mq-ship-track-btn:hover { background: #f7faff; }
        .mq-ship-track-btn:disabled { opacity: 0.6; cursor: not-allowed; }
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
            width: 100%;
          }
          .mq-doc-btns {
            width: 100%;
          }
          .mq-doc-btns .mq-receipt-btn,
          .mq-doc-btns .mq-invoice-btn {
            flex: 1 1 calc(50% - 4px);
            min-width: 0;
            justify-content: center;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .mq-offer-grid { grid-template-columns: 1fr; }
          .mq-card { padding: 16px; }
          .mq-invoice-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .mq-doc-btns {
            flex-direction: column;
            width: 100%;
          }
          .mq-pay-btn,
          .mq-receipt-btn,
          .mq-invoice-btn {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
