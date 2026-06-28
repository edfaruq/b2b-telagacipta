"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { computeTotalPenawaran, formatPenawaranFields } from "@/lib/penawaran";
import {
  formatAmountOnInput,
  formatNumberFieldValue,
  parseThousandsId,
} from "@/lib/number-input";
import type { PendingQuotationRow } from "@/components/admin/PendingQuotationsPanel";

type Props = {
  row: PendingQuotationRow;
  onClose: () => void;
  onSent: () => Promise<void>;
};

const EXPEDITION_OPTIONS = [
  "JNE",
  "J&T Express",
  "SiCepat",
  "AnterAja",
  "Pos Indonesia",
  "Tiki",
  "Wahana",
  "DHL",
  "FedEx",
  "Other",
] as const;

export function SendQuotationModal({ row, onClose, onSent }: Props) {
  const indicativeUnit = row.unitPriceAmount > 0 ? row.unitPriceAmount : 0;

  const [hargaInput, setHargaInput] = useState("");
  const [biayaInput, setBiayaInput] = useState("0");
  const [expeditionChoice, setExpeditionChoice] = useState<string>(EXPEDITION_OPTIONS[0]);
  const [expeditionOther, setExpeditionOther] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesMock, setRatesMock] = useState(false);
  const [error, setError] = useState("");

  const expeditionValue =
    expeditionChoice === "Other" ? expeditionOther.trim() : expeditionChoice;

  useEffect(() => {
    if (indicativeUnit > 0) {
      setHargaInput(formatNumberFieldValue(indicativeUnit, "amount"));
    } else {
      setHargaInput("");
    }
    setBiayaInput(formatNumberFieldValue(0));
    setExpeditionChoice(EXPEDITION_OPTIONS[0]);
    setExpeditionOther("");
    setRatesMock(false);
    setError("");
  }, [row.id_permintaan, indicativeUnit]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const hargaTon = parseThousandsId(hargaInput);
  const biayaPengiriman = parseThousandsId(biayaInput);
  const total = computeTotalPenawaran(
    Number.isFinite(hargaTon) ? hargaTon : 0,
    row.jumlah_permintaan,
    Number.isFinite(biayaPengiriman) ? biayaPengiriman : 0
  );

  const formatted = formatPenawaranFields(
    Number.isFinite(hargaTon) ? hargaTon : 0,
    row.jumlah_permintaan,
    Number.isFinite(biayaPengiriman) ? biayaPengiriman : 0,
    total,
    row.satuan
  );

  const handleEstimateShipping = async () => {
    if (!expeditionValue) {
      setError("Select expedition before generating shipping cost.");
      return;
    }
    setRatesLoading(true);
    setRatesMock(false);
    setError("");
    try {
      const res = await fetch("/api/admin/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_permintaan: row.id_permintaan,
          expedition: expeditionValue,
          quantity: row.jumlah_permintaan,
          destination_country: row.negara,
        }),
      });
      const data = (await res.json()) as {
        rates?: Array<{ price: number; courierName: string; serviceName: string; company: string; serviceType: string }>;
        mock?: boolean;
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "Could not fetch shipping rates.");
        return;
      }
      const list = data.rates ?? [];
      if (list.length === 0) {
        setError("No rates returned for this route. Check address or courier.");
        return;
      }
      const needle = expeditionValue.split(/\s+/)[0]?.toLowerCase() ?? "";
      const match =
        list.find(
          (r) =>
            r.courierName.toLowerCase().includes(needle) ||
            r.company.toLowerCase().includes(needle) ||
            expeditionValue.toLowerCase().includes(r.courierName.toLowerCase())
        ) ?? list[0];
      setBiayaInput(formatNumberFieldValue(Math.round(match.price)));
      setRatesMock(Boolean(data.mock));
    } catch {
      setError("Could not reach shipping rates service.");
    } finally {
      setRatesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!Number.isFinite(hargaTon) || hargaTon <= 0) {
      setError("Unit price must be greater than 0.");
      return;
    }
    if (!Number.isFinite(biayaPengiriman) || biayaPengiriman < 0) {
      setError("Shipping cost cannot be negative.");
      return;
    }
    if (!expeditionValue) {
      setError("Please select or enter an expedition company.");
      return;
    }
    if (expeditionValue.length > 120) {
      setError("Expedition name is too long (max 120 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_permintaan: row.id_permintaan,
          harga_ton: hargaTon,
          biaya_pengiriman: biayaPengiriman,
          expedition: expeditionValue,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Failed to send quotation.");
        return;
      }
      await onSent();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="overlay-anim sq-overlay"
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="sq-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sq-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sq-modal-head">
          <div>
            <h3 id="sq-modal-title" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#051C4A" }}>
              Send Quotation
            </h3>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#6A84B0" }}>
              {row.nama_produk} — {row.nama}
            </p>
          </div>
          <button
            type="button"
            className="sq-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="sq-dialog__form" onSubmit={handleSubmit}>
          <div className="sq-dialog__body">
          {error ? (
            <p
              style={{
                margin: "0 0 14px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "13px",
              }}
            >
              {error}
            </p>
          ) : null}

          <label style={{ display: "block", marginBottom: "14px" }}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#6A84B0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              Unit price (per {row.satuan})
            </span>
            <div className="sq-currency-field">
              <span className="sq-currency-prefix">Rp</span>
              <input
                type="text"
                inputMode="decimal"
                className="sq-input sq-currency-input"
                value={hargaInput}
                onChange={(e) => setHargaInput(formatAmountOnInput(e.target.value))}
                required
              />
            </div>
            <span style={{ fontSize: "12px", color: "#9aa8c7" }}>
              Indicative: {row.unitPriceLabel} /{row.satuan}
            </span>
          </label>

          <label style={{ display: "block", marginBottom: "14px" }}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#6A84B0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              Expedition
            </span>
            <select
              className="sq-input sq-select"
              value={expeditionChoice}
              onChange={(e) => setExpeditionChoice(e.target.value)}
              required
            >
              {EXPEDITION_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {expeditionChoice === "Other" ? (
              <input
                type="text"
                className="sq-input"
                style={{ marginTop: "8px" }}
                placeholder="Expedition company name"
                value={expeditionOther}
                onChange={(e) => setExpeditionOther(e.target.value)}
                maxLength={120}
                required
              />
            ) : null}
          </label>

          <label style={{ display: "block", marginBottom: "14px" }}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "#6A84B0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              Shipping cost
            </span>
            <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
              <div className="sq-currency-field" style={{ flex: 1 }}>
                <span className="sq-currency-prefix">Rp</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="sq-input sq-currency-input"
                  value={biayaInput}
                  onChange={(e) => setBiayaInput(formatAmountOnInput(e.target.value))}
                  required
                />
              </div>
              <button
                type="button"
                className="acct-btn acct-btn--ghost"
                disabled={submitting || ratesLoading}
                onClick={() => void handleEstimateShipping()}
                style={{ whiteSpace: "nowrap", fontSize: "13px" }}
              >
                {ratesLoading ? "Generating…" : "Generate Price"}
              </button>
            </div>
            {ratesMock ? (
              <span className="sq-mock-rate-label">Mock shipping rate</span>
            ) : null}
          </label>

          <div
            style={{
              background: "#f7faff",
              border: "1px solid #edf2ff",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "18px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#6A84B0" }}>
              Quantity: {row.jumlah_permintaan} {row.satuan}
            </p>
            {expeditionValue ? (
              <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#4A6490" }}>
                Expedition: <strong style={{ color: "#051C4A" }}>{expeditionValue}</strong>
              </p>
            ) : null}
            <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#4A6490" }}>
              Subtotal: {formatted.subtotalLabel}
            </p>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#051C4A" }}>
              Total quotation: {formatted.totalPenawaranLabel}
            </p>
          </div>
          </div>

          <div className="sq-dialog__footer">
            <div className="acct-btn-group" style={{ justifyContent: "flex-end" }}>
              <button type="submit" className="acct-btn acct-btn--primary" disabled={submitting}>
                {submitting ? "Sending…" : "Send to customer"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .sq-overlay {
          position: fixed;
          inset: 0;
          z-index: 70;
          background: rgba(5, 28, 74, 0.4);
          backdrop-filter: blur(3px);
          overflow-y: auto;
          display: flex;
          justify-content: center;
          padding: max(24px, env(safe-area-inset-top, 0px)) 16px 32px;
          box-sizing: border-box;
          font-family: "Plus Jakarta Sans", sans-serif;
        }
        .sq-dialog {
          margin: auto;
          width: min(520px, calc(100vw - 32px));
          max-height: min(90vh, 720px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
          border-radius: 16px;
          border: 1px solid #d0deff;
          box-shadow: 0 20px 50px rgba(10, 40, 120, 0.22);
        }
        .sq-dialog__form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        .sq-dialog__body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 20px 22px;
        }
        .sq-dialog__footer {
          flex-shrink: 0;
          padding: 0 22px 22px;
          border-top: 1px solid #edf2ff;
        }
        .sq-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid #edf2ff;
          background: #f7faff;
        }
        .sq-close {
          border: 1px solid #d0deff;
          background: #fff;
          color: #6a84b0;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          flex-shrink: 0;
          font-family: inherit;
        }
        .sq-close:disabled { opacity: 0.5; cursor: not-allowed; }
        .sq-currency-field {
          display: flex;
          align-items: stretch;
          margin-bottom: 4px;
        }
        .sq-currency-prefix {
          display: inline-flex;
          align-items: center;
          padding: 0 12px;
          font-size: 15px;
          font-weight: 600;
          color: #6a84b0;
          background: #f7faff;
          border: 1px solid #d0deff;
          border-right: none;
          border-radius: 10px 0 0 10px;
          user-select: none;
        }
        .sq-currency-input {
          flex: 1;
          min-width: 0;
          border-radius: 0 10px 10px 0 !important;
        }
        .sq-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #d0deff;
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          color: #1a3566;
          margin-bottom: 4px;
        }
        .sq-currency-field .sq-input {
          margin-bottom: 0;
        }
        .sq-input:focus {
          outline: none;
          border-color: #0b47b8;
          box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.12);
        }
        .sq-select {
          cursor: pointer;
          appearance: auto;
        }
        .sq-mock-rate-label {
          display: inline-block;
          margin-top: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #92400e;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 2px 8px;
        }
        @media (max-width: 768px) {
          .sq-dialog {
            width: calc(100vw - 24px) !important;
            max-height: calc(100dvh - 24px);
          }
          .sq-dialog__body {
            padding: 16px;
          }
          .sq-dialog__footer {
            padding: 0 16px 16px;
          }
          .sq-dialog__footer .acct-btn-group {
            flex-direction: column-reverse;
            width: 100%;
          }
          .sq-dialog__footer .acct-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}
