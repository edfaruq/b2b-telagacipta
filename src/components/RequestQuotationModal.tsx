"use client";

import { useEffect, useMemo, useState } from "react";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { formatPriceIdr } from "@/lib/catalog-product";
import { formatThousandsId } from "@/lib/number-input";
import { normalizeQuantityOnBlur, parseQuantityInput } from "@/lib/quantity-input";

type Props = {
  open: boolean;
  onClose: () => void;
  productTitle: string;
  productSlug: string;
  unitLabel: string;
  maxStock: number;
  initialQuantity: number;
  unitPriceLabel: string;
  unitPriceAmount: number;
};

export function RequestQuotationModal({
  open,
  onClose,
  productTitle,
  productSlug,
  unitLabel,
  maxStock,
  initialQuantity,
  unitPriceLabel,
  unitPriceAmount,
}: Props) {
  const [quantity, setQuantity] = useState(initialQuantity < 1 ? 1 : initialQuantity);
  const [quantityInput, setQuantityInput] = useState(
    formatThousandsId(initialQuantity < 1 ? 1 : initialQuantity)
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    const qty = initialQuantity < 1 ? 1 : initialQuantity;
    setQuantity(qty);
    setQuantityInput(formatThousandsId(qty));
    setError("");
    setSuccess("");
    setSubmitting(false);

    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" });
        const data = (await res.json()) as {
          profile?: { alamat: string; negara: string };
        };
        if (cancelled || !res.ok || !data.profile) return;
        const { alamat, negara } = data.profile;
        const combined = [alamat?.trim(), negara?.trim()].filter(Boolean).join(", ");
        if (combined) setDeliveryAddress(combined);
      } catch {
        /* optional prefill */
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, initialQuantity]);

  const totalPriceLabel = useMemo(
    () => formatPriceIdr(unitPriceAmount * quantity),
    [unitPriceAmount, quantity]
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: productSlug,
          quantity,
          deliveryAddress,
          notes,
        }),
      });
      const data = (await res.json()) as { message?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.message ?? "Failed to submit quotation request.");
        return;
      }
      setSuccess(data.message ?? "Quotation request submitted.");
      window.setTimeout(() => {
        onClose();
        setSuccess("");
        setNotes("");
      }, 2200);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      className="rq-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div role="dialog" aria-modal aria-labelledby="rq-title" className="rq-dialog">
        <div className="rq-header">
          <h2 id="rq-title">Request Quotation</h2>
          <button type="button" className="rq-close" onClick={onClose} disabled={submitting} aria-label="Close">
            ×
          </button>
        </div>

        <p className="rq-product">{productTitle}</p>

        {success ? (
          <div className="rq-success">{success}</div>
        ) : (
          <form onSubmit={handleSubmit} className="rq-form">
            <label className="rq-label">
              <span className="rq-label-text">
                Quantity ({unitLabel.replace(/^\//, "")})
                <span className="rq-required" aria-hidden="true">*</span>
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="rq-input"
                required
                value={quantityInput}
                placeholder="1"
                onChange={(e) => {
                  const next = parseQuantityInput(e.target.value, maxStock);
                  if (!next) return;
                  setQuantityInput(next.input);
                  setQuantity(next.quantity);
                }}
                onBlur={() => {
                  const next = normalizeQuantityOnBlur(quantityInput, maxStock);
                  setQuantityInput(next.input);
                  setQuantity(next.quantity);
                }}
              />
              <span className="rq-hint">Max. {maxStock} in stock</span>
            </label>

            <label className="rq-label">
              <span className="rq-label-text">
                Delivery address
                <span className="rq-required" aria-hidden="true">*</span>
              </span>
              <textarea
                className="rq-input rq-textarea"
                rows={5}
                required
                placeholder="Full delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={loadingProfile}
              />
              {loadingProfile ? <span className="rq-hint">Loading your profile address…</span> : null}
            </label>

            <label className="rq-label">
              <span className="rq-label-text">
                Notes <span className="rq-optional">(optional)</span>
              </span>
              <textarea
                className="rq-input rq-textarea"
                rows={4}
                placeholder="Packaging, delivery timeline, or other requirements"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {error ? (
              <div style={alertFailBanner} className="rq-error">
                {error}
              </div>
            ) : null}

            <div className="rq-modal-footer">
              <div className="rq-pricing">
                <p className="rq-unit-price">
                  {unitPriceLabel}
                  <span className="rq-meta-unit">{unitLabel}</span>
                </p>
                <p className="rq-total-price">Total {totalPriceLabel}</p>
              </div>

              <div className="rq-actions">
                <button type="submit" className="rq-btn-primary" disabled={submitting || quantity < 1}>
                  {submitting ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </div>
          </form>
        )}

        <style>{`
          .rq-overlay {
            position: fixed;
            inset: 0;
            z-index: 90;
            background: rgba(5, 28, 74, 0.42);
            backdrop-filter: blur(3px);
            display: grid;
            place-items: center;
            padding: 16px;
            animation: rqFadeIn 0.22s ease both;
          }
          .rq-dialog {
            width: min(960px, calc(100vw - 32px));
            max-height: min(94vh, 960px);
            overflow-y: auto;
            background: #fff;
            border-radius: 18px;
            border: 1px solid #d0deff;
            box-shadow: 0 24px 60px rgba(10, 40, 120, 0.24);
            padding: 32px 40px 36px;
            display: flex;
            flex-direction: column;
            animation: rqSlideUp 0.26s ease both;
          }
          .rq-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 10px;
          }
          .rq-header h2 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            color: #051c4a;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .rq-close {
            border: 1px solid #d0deff;
            background: #fff;
            color: #6a84b0;
            width: 36px;
            height: 36px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
          }
          .rq-product {
            margin: 0 0 6px;
            font-size: 18px;
            font-weight: 600;
            color: #1a3566;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .rq-modal-footer {
            margin-top: 12px;
            padding-top: 20px;
            border-top: 1px solid #edf2ff;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px 24px;
          }
          .rq-pricing {
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .rq-unit-price {
            margin: 0;
            font-size: 15px;
            font-weight: 500;
            color: #6a84b0;
          }
          .rq-total-price {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
            color: #051c4a;
          }
          .rq-meta-unit { margin-left: 4px; }
          .rq-form { display: flex; flex-direction: column; gap: 22px; }
          .rq-label {
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .rq-label-text {
            font-size: 13px;
            font-weight: 600;
            color: #6a84b0;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .rq-required {
            color: #ef4444;
            margin-left: 2px;
            text-transform: none;
          }
          .rq-optional {
            text-transform: none;
            font-weight: 500;
            color: #9aa8c7;
          }
          .rq-input {
            border: 1px solid #dbe7ff;
            border-radius: 10px;
            padding: 14px 16px;
            font-size: 16px;
            color: #1a3566;
            font-family: 'Plus Jakarta Sans', sans-serif;
            outline: none;
          }
          .rq-input:focus {
            border-color: #0b47b8;
            box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.12);
          }
          .rq-textarea { resize: vertical; min-height: 110px; text-transform: none; font-weight: 400; }
          .rq-hint {
            font-size: 12px;
            font-weight: 500;
            color: #9aa8c7;
            text-transform: none;
            letter-spacing: 0;
          }
          .rq-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin: 0;
            margin-left: auto;
          }
          .rq-btn-primary {
            border-radius: 999px;
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 600;
            font-family: 'Plus Jakarta Sans', sans-serif;
            cursor: pointer;
            border: none;
            background: #0b47b8;
            color: #fff;
            box-shadow: 0 3px 10px rgba(11, 71, 184, 0.25);
          }
          .rq-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
          .rq-error { margin: 0; font-size: 13px; }
          .rq-success {
            margin: 0;
            padding: 12px 14px;
            border-radius: 8px;
            background: #ecfdf3;
            border: 1px solid #bbf7d0;
            color: #166534;
            font-size: 14px;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          @keyframes rqFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes rqSlideUp {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
