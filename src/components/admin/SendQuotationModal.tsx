"use client";

import { useEffect, useState } from "react";
import { computeTotalPenawaran, formatPenawaranFields } from "@/lib/penawaran";
import type { PendingQuotationRow } from "@/components/admin/PendingQuotationsPanel";

type Props = {
  row: PendingQuotationRow;
  onClose: () => void;
  onSent: () => Promise<void>;
};

function parseAmountInput(value: string): number {
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

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
  const [error, setError] = useState("");

  const expeditionValue =
    expeditionChoice === "Other" ? expeditionOther.trim() : expeditionChoice;

  useEffect(() => {
    if (indicativeUnit > 0) {
      setHargaInput(String(Math.round(indicativeUnit)));
    }
    setBiayaInput("0");
    setExpeditionChoice(EXPEDITION_OPTIONS[0]);
    setExpeditionOther("");
    setError("");
  }, [row.id_permintaan, indicativeUnit]);

  const hargaTon = parseAmountInput(hargaInput);
  const biayaPengiriman = parseAmountInput(biayaInput);
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

  return (
    <div
      className="overlay-anim"
      onClick={() => !submitting && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5, 28, 74, 0.40)",
        backdropFilter: "blur(3px)",
        display: "grid",
        placeItems: "center",
        zIndex: 70,
        padding: "16px",
      }}
    >
      <div
        className="modal-anim"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          maxHeight: "min(90vh, 720px)",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid #d0deff",
          boxShadow: "0 20px 50px rgba(10,40,120,0.22)",
        }}
      >
        <div className="sq-modal-head">
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#051C4A" }}>
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

        <form onSubmit={handleSubmit} style={{ padding: "20px 22px 22px" }}>
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
            <input
              type="text"
              inputMode="decimal"
              className="sq-input"
              value={hargaInput}
              onChange={(e) => setHargaInput(e.target.value)}
              required
            />
            <span style={{ fontSize: "12px", color: "#9aa8c7" }}>
              Indicative: {row.unitPriceLabel}
              {row.satuan}
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
            <input
              type="text"
              inputMode="decimal"
              className="sq-input"
              value={biayaInput}
              onChange={(e) => setBiayaInput(e.target.value)}
              required
            />
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

          <div className="acct-btn-group" style={{ justifyContent: "flex-end", marginTop: "8px" }}>
            <button type="submit" className="acct-btn acct-btn--primary" disabled={submitting}>
              {submitting ? "Sending…" : "Send to customer"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
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
        }
        .sq-close:disabled { opacity: 0.5; cursor: not-allowed; }
        .sq-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #d0deff;
          border-radius: 10px;
          font-size: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1a3566;
          margin-bottom: 4px;
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
      `}</style>
    </div>
  );
}
