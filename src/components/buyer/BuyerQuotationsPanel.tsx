"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { permintaanRequestIdLabel } from "@/lib/permintaan-request-id";
import { permintaanStatusLabel, permintaanStatusStyle } from "@/lib/permintaan-status";

function IconBrowseProducts() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path
        d="M3 7h18M5 7l1.2 12h11.6L19 7M9 11v4m6-4v4M10 7V5a1 1 0 011-1h2a1 1 0 011 1v2"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const quotationsAnimStyles = `
  @keyframes quotationsPageIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes quotationsCardIn {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes quotationsShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .quotations-wrap {
    animation: quotationsPageIn 0.45s ease-out both;
  }
  .quotations-header {
    animation: quotationsPageIn 0.42s ease-out both;
  }
  .quotations-error {
    animation: quotationsPageIn 0.3s ease-out both;
  }
  .quotations-empty {
    animation: quotationsCardIn 0.45s 0.08s ease-out both;
  }
  .quotation-card {
    opacity: 0;
    animation: quotationsCardIn 0.42s ease-out forwards;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .quotation-card:hover {
    border-color: #8eb0ff;
    box-shadow: 0 10px 28px rgba(10, 40, 120, 0.1);
    transform: translateY(-2px);
  }
  .quotations-footer {
    opacity: 0;
    animation: quotationsCardIn 0.42s ease-out forwards;
  }
  .quotations-browse-btn {
    transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
  }
  .quotations-browse-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(11, 71, 184, 0.28);
  }
  .quotations-skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .quotation-card--skeleton {
    opacity: 1;
    animation: quotationsCardIn 0.42s ease-out both;
    pointer-events: none;
  }
  .quotation-card--skeleton:hover {
    transform: none;
    border-color: #d0deff;
    box-shadow: 0 4px 16px rgba(10, 40, 120, 0.06);
  }
  .quotations-skeleton-block {
    background: linear-gradient(90deg, #e6edf9 0%, #f5f8ff 45%, #e6edf9 90%);
    background-size: 200% 100%;
    animation: quotationsShimmer 1.35s ease-in-out infinite;
    border-radius: 10px;
  }
  .quotations-skeleton-thumb {
    width: 96px;
    height: 96px;
    border-radius: 12px;
    flex-shrink: 0;
  }
  .quotations-skeleton-pill {
    width: 88px;
    height: 32px;
    border-radius: 999px;
  }
  @media (prefers-reduced-motion: reduce) {
    .quotations-wrap,
    .quotations-header,
    .quotations-error,
    .quotations-empty,
    .quotation-card,
    .quotations-footer {
      animation: none;
      opacity: 1;
      transform: none;
    }
    .quotation-card:hover { transform: none; }
    .quotations-skeleton-block { animation: none; background: #e6edf9; }
  }
`;

function QuotationsLoadingSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div
      className="quotations-skeleton-list"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading quotations"
    >
      {Array.from({ length: count }, (_, index) => (
        <article
          key={index}
          className="quotation-card quotation-card--skeleton"
          style={{ animationDelay: `${index * 90 + 60}ms` }}
        >
          <div className="quotation-card-top">
            <div className="quotation-product">
              <div className="quotations-skeleton-block quotations-skeleton-thumb" />
              <div className="quotation-product-meta" style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="quotations-skeleton-block"
                  style={{ height: 26, width: "58%", marginBottom: 10 }}
                />
                <div
                  className="quotations-skeleton-block"
                  style={{ height: 14, width: "32%", marginBottom: 8 }}
                />
                <div className="quotations-skeleton-block" style={{ height: 14, width: "42%" }} />
              </div>
            </div>
            <div className="quotations-skeleton-block quotations-skeleton-pill" />
          </div>
          <div className="quotation-grid">
            {[72, 64, 80].map((w) => (
              <div key={w}>
                <div
                  className="quotations-skeleton-block"
                  style={{ height: 11, width: 56, marginBottom: 10 }}
                />
                <div className="quotations-skeleton-block" style={{ height: 22, width: `${w}%` }} />
              </div>
            ))}
          </div>
          <div className="quotation-block">
            <div
              className="quotations-skeleton-block"
              style={{ height: 11, width: 120, marginBottom: 10 }}
            />
            <div className="quotations-skeleton-block" style={{ height: 16, width: "100%" }} />
            <div
              className="quotations-skeleton-block"
              style={{ height: 16, width: "88%", marginTop: 8 }}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

type QuotationOffer = {
  id: number;
  unitPriceLabel: string;
  shippingLabel: string;
  expedition: string;
  subtotalLabel: string;
  totalLabel: string;
  status: string;
  statusLabel: string;
  sentAt: string;
  canRespond: boolean;
};

type QuotationItem = {
  id: number;
  requestSequence: number;
  productName: string;
  productSlug: string;
  productImage: string;
  quantity: number;
  unit: string;
  unitPriceLabel: string;
  estimatedTotalLabel: string;
  deliveryAddress: string;
  notes: string;
  status: string;
  requestedAt: string;
  offer: QuotationOffer | null;
};

export function BuyerQuotationsPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadQuotations = async () => {
    const res = await fetch("/api/quotations", { cache: "no-store" });
    const data = (await res.json()) as {
      quotations?: QuotationItem[];
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

  const handleOfferAction = async (idPermintaan: number, action: "accept" | "reject") => {
    setActionMessage("");
    setProcessingId(idPermintaan);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_permintaan: idPermintaan, action }),
      });
      const data = (await res.json()) as {
        message?: string;
        invoice?: { id_invoice: number; nomor_invoice: string };
      };
      if (!res.ok) {
        setActionMessage(data.message ?? "Could not update quotation.");
        return;
      }
      if (action === "accept") {
        setActionMessage(data.message ?? "Quotation accepted. Invoice generated.");
        router.push("/account/my-quotation");
        return;
      }
      setActionMessage(data.message ?? "Quotation updated.");
      await loadQuotations();
    } catch {
      setActionMessage("Could not reach the server.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className="quotations-panel">
        <div className="quotations-wrap">
          <header className="quotations-header">
            <h1 className="quotations-title">My Requests</h1>
            <p className="quotations-subtitle">
              Track your product requests and their status.
            </p>
          </header>

          {error ? (
            <div style={alertFailBanner} className="quotations-error">
              {error}
            </div>
          ) : null}

          {actionMessage && !error ? (
            <p className="quotations-action-msg">{actionMessage}</p>
          ) : null}

          {loading ? (
            <QuotationsLoadingSkeleton count={2} />
          ) : quotations.length === 0 ? (
            <div className="quotations-empty">
              <p>You have not submitted any requests yet.</p>
              <Link href="/products" className="quotations-browse-btn">
                Submit a request
              </Link>
            </div>
          ) : (
            <>
            <div className="quotations-list">
              {quotations.map((item, index) => {
                const statusStyle = permintaanStatusStyle(item.status);
                const qtyLabel = Number.isInteger(item.quantity)
                  ? String(item.quantity)
                  : item.quantity.toLocaleString("id-ID");
                const dateLabel = new Date(item.requestedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <article
                    key={item.id}
                    className="quotation-card"
                    style={{ animationDelay: `${Math.min(index, 10) * 70 + 80}ms` }}
                  >
                    <div className="quotation-card-top">
                      <div className="quotation-product">
                        <div className="quotation-thumb">
                          <Image
                            src={item.productImage}
                            alt=""
                            width={96}
                            height={96}
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                          />
                        </div>
                        <div className="quotation-product-meta">
                          <Link href={`/products/${item.productSlug}`} className="quotation-product-name">
                            {item.productName}
                          </Link>
                          <p className="quotation-id">
                            {permintaanRequestIdLabel(item.requestSequence, item.requestedAt)}
                          </p>
                          <p className="quotation-date">{dateLabel}</p>
                        </div>
                      </div>
                      <span
                        className="quotation-status"
                        style={{
                          background: statusStyle.background,
                          color: statusStyle.color,
                          border: statusStyle.border,
                        }}
                      >
                        {permintaanStatusLabel(item.status)}
                      </span>
                    </div>

                    <div className="quotation-grid">
                      <div>
                        <span className="quotation-label">Quantity</span>
                        <p className="quotation-value">
                          {qtyLabel} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="quotation-label">Unit price</span>
                        <p className="quotation-value">
                          {item.unitPriceLabel}
                          <span className="quotation-unit"> /{item.unit}</span>
                        </p>
                      </div>
                      <div>
                        <span className="quotation-label">Est. total</span>
                        <p className="quotation-value quotation-total">{item.estimatedTotalLabel}</p>
                      </div>
                    </div>

                    <div className="quotation-block">
                      <span className="quotation-label">Delivery address</span>
                      <p className="quotation-address">{item.deliveryAddress}</p>
                    </div>

                    {item.notes.trim() ? (
                      <div className="quotation-block">
                        <span className="quotation-label">Notes</span>
                        <p className="quotation-notes">{item.notes}</p>
                      </div>
                    ) : null}

                    {item.offer ? (
                      <div className="quotation-offer">
                        <div className="quotation-offer-head">
                          <span className="quotation-label">Quotation</span>
                          <span className="quotation-offer-status">{item.offer.statusLabel}</span>
                        </div>
                        <div className="quotation-offer-grid">
                          <div>
                            <span className="quotation-offer-meta">Unit price</span>
                            <p className="quotation-offer-value">{item.offer.unitPriceLabel}</p>
                          </div>
                          <div>
                            <span className="quotation-offer-meta">Expedition</span>
                            <p className="quotation-offer-value">{item.offer.expedition || "—"}</p>
                          </div>
                          <div>
                            <span className="quotation-offer-meta">Shipping</span>
                            <p className="quotation-offer-value">{item.offer.shippingLabel}</p>
                          </div>
                          <div>
                            <span className="quotation-offer-meta">Subtotal</span>
                            <p className="quotation-offer-value">{item.offer.subtotalLabel}</p>
                          </div>
                          <div>
                            <span className="quotation-offer-meta">Total</span>
                            <p className="quotation-offer-total">{item.offer.totalLabel}</p>
                          </div>
                        </div>
                        {item.offer.canRespond ? (
                          <div className="quotation-offer-actions">
                            <button
                              type="button"
                              className="quotation-btn-accept"
                              disabled={processingId === item.id}
                              onClick={() => handleOfferAction(item.id, "accept")}
                            >
                              {processingId === item.id ? "Processing…" : "Accept quotation"}
                            </button>
                            <button
                              type="button"
                              className="quotation-btn-reject"
                              disabled={processingId === item.id}
                              onClick={() => handleOfferAction(item.id, "reject")}
                            >
                              Decline
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
            <footer
              className="quotations-footer"
              style={{
                animationDelay: `${Math.min(quotations.length, 10) * 70 + 160}ms`,
              }}
            >
              <div className="quotations-footer-divider" aria-hidden />
              <p className="quotations-footer-text">
                Browse more products for your next export quotation request.
              </p>
              <Link href="/products" className="quotations-browse-btn">
                <IconBrowseProducts />
                Browse products
              </Link>
            </footer>
            </>
          )}
        </div>
      </div>

      <style>{`${quotationsAnimStyles}
        .quotations-panel {
          color: #1f2937;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .quotations-wrap {
          width: 100%;
          max-width: 100%;
          animation: quotationsPageIn 0.45s ease-out both;
        }
        .quotations-header {
          margin-bottom: 28px;
        }
        .quotations-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
          margin-top: 28px;
          padding-top: 4px;
        }
        .quotations-footer-divider {
          width: 100%;
          height: 1px;
          margin: 0;
          background: #d0deff;
        }
        .quotations-footer-text {
          margin: 8px 0 0;
          max-width: 560px;
          font-size: 17px;
          line-height: 1.55;
          color: #6a84b0;
        }
        .quotations-title {
          margin: 0 0 8px;
          font-size: 32px;
          line-height: 1.15;
          letter-spacing: -0.4px;
          color: #051c4a;
        }
        .quotations-subtitle {
          margin: 0;
          font-size: 17px;
          color: #6a84b0;
        }
        .quotations-browse-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 13px 26px;
          background: #0b47b8;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 3px 10px rgba(11, 71, 184, 0.22);
          white-space: nowrap;
        }
        .quotations-browse-btn:hover {
          background: #093a9a;
        }
        .quotations-error {
          margin: 0 0 20px;
          font-size: 14px;
        }
        .quotations-muted {
          color: #6a84b0;
          font-size: 17px;
        }
        .quotations-empty {
          border: 1px dashed #c9dcff;
          border-radius: 16px;
          background: #fff;
          padding: 48px 28px;
          font-size: 17px;
          text-align: center;
          color: #6a84b0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .quotations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .quotation-card {
          background: #fff;
          border: 1px solid #d0deff;
          border-radius: 14px;
          padding: 20px 22px;
          box-shadow: 0 4px 16px rgba(10, 40, 120, 0.06);
        }
        .quotation-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }
        .quotation-product {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .quotation-thumb {
          width: 96px;
          height: 96px;
          border-radius: 10px;
          overflow: hidden;
          background: #e5e7eb;
          flex-shrink: 0;
        }
        .quotation-product-meta {
          min-width: 0;
        }
        .quotation-product-name {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #051c4a;
          text-decoration: none;
          margin-bottom: 6px;
        }
        .quotation-product-name:hover {
          color: #0b47b8;
        }
        .quotation-id,
        .quotation-date {
          margin: 0;
          font-size: 15px;
          color: #6a84b0;
        }
        .quotation-status {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 7px 16px;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .quotation-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }
        .quotation-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6a84b0;
          margin-bottom: 8px;
        }
        .quotation-value {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a3566;
        }
        .quotation-unit {
          font-weight: 500;
          color: #6a84b0;
          font-size: 16px;
        }
        .quotation-total {
          color: #051c4a;
          font-size: 22px;
          font-weight: 700;
        }
        .quotation-block {
          margin-top: 16px;
        }
        .quotation-address,
        .quotation-notes {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          color: #4a6490;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .quotations-action-msg {
          margin: 0 0 18px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 14px;
        }
        .quotation-offer {
          margin-top: 20px;
          padding: 18px 20px;
          border-radius: 12px;
          background: #f7faff;
          border: 1px solid #c9dcff;
        }
        .quotation-offer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .quotation-offer-status {
          font-size: 13px;
          font-weight: 700;
          color: #0b47b8;
          background: #fff;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 4px 12px;
        }
        .quotation-offer-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 20px;
        }
        .quotation-offer-meta {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #6a84b0;
          margin-bottom: 4px;
        }
        .quotation-offer-value {
          margin: 0;
          font-size: 17px;
          font-weight: 600;
          color: #1a3566;
        }
        .quotation-offer-total {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #051c4a;
        }
        .quotation-offer-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }
        .quotation-btn-accept,
        .quotation-btn-reject {
          border: none;
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .quotation-btn-accept {
          background: #16a34a;
          color: #fff;
        }
        .quotation-btn-accept:disabled,
        .quotation-btn-reject:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .quotation-btn-reject {
          background: #fff;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        @media (max-width: 760px) {
          .quotations-title { font-size: 34px; }
          .quotation-grid { grid-template-columns: 1fr; }
          .quotation-offer-grid { grid-template-columns: 1fr; }
          .quotation-card-top { flex-direction: column; }
          .quotation-card { padding: 22px 20px; }
          .quotation-product-name { font-size: 20px; }
          .quotation-value { font-size: 18px; }
          .quotation-total { font-size: 20px; }
        }
      `}</style>
    </>
  );
}
