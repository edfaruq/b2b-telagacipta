"use client";

import { useRef, useState } from "react";
import { buyerModalAnimStyles } from "@/lib/buyer-modal-anim";
import { PAYMENT_BANK } from "@/lib/payment-bank";

const ACCEPTED_PROOF_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_PROOF_BYTES = 5 * 1024 * 1024;

function IconUpload() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke="#0B47B8"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBca() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden
      className="pay-bca-icon"
    >
      <rect width="44" height="44" rx="10" fill="#005BAA" />
      <text
        x="22"
        y="27"
        textAnchor="middle"
        fill="#fff"
        fontSize="13"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        BCA
      </text>
    </svg>
  );
}

type Props = {
  invoiceId: number;
  invoiceNumber: string;
  totalLabel?: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function PayInvoiceModal({
  invoiceId,
  invoiceNumber,
  totalLabel,
  onClose,
  onSubmitted,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const clearFile = () => {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = (next: File | null) => {
    setError("");
    if (!next) {
      clearFile();
      return;
    }
    if (!ACCEPTED_PROOF_TYPES.has(next.type)) {
      setError("File must be PNG, JPG, or WEBP.");
      return;
    }
    if (next.size > MAX_PROOF_BYTES) {
      setError("File must be 5 MB or smaller.");
      return;
    }
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(next);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0] ?? null);
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_BANK.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Please attach your payment proof (transfer receipt).");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("proof", file);
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not submit payment.");
        return;
      }
      onSubmitted();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pay-overlay buyer-modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="pay-modal buyer-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pay-modal-head">
          <div>
            <h2 className="pay-title">Pay invoice</h2>
            <p className="pay-inv-number">{invoiceNumber}</p>
          </div>
          <button
            type="button"
            className="pay-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="pay-amount-box">
          <span className="pay-amount-label">Total to pay</span>
          <p className="pay-amount-value">{totalLabel ?? "—"}</p>
          <p className="pay-amount-note">Transfer the exact amount below before uploading proof.</p>
        </div>

        <div className="pay-transfer-box">
          <span className="pay-section-label">Transfer to</span>
          <div className="pay-bank-row">
            <IconBca />
            <div className="pay-bank-details">
              <p className="pay-bank-name">{PAYMENT_BANK.bankName}</p>
              <p className="pay-account-number">{PAYMENT_BANK.accountNumber}</p>
              <p className="pay-account-holder">{PAYMENT_BANK.accountHolder}</p>
            </div>
            <button
              type="button"
              className="pay-copy-btn"
              onClick={handleCopyAccount}
              title="Copy account number"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <p className="pay-hint">
          After transferring, upload your payment proof (transfer receipt). We will validate
          your payment before shipping the order.
        </p>

        <form onSubmit={handleSubmit}>
          {error ? <p className="pay-error">{error}</p> : null}

          <span className="pay-section-label">Payment proof</span>

          {file && previewUrl ? (
            <div className="pay-proof-preview">
              <img src={previewUrl} alt="" className="pay-proof-img" />
              <div className="pay-proof-meta">
                <p className="pay-proof-name">{file.name}</p>
                <button type="button" className="pay-proof-change" onClick={clearFile}>
                  Change file
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`pay-dropzone${dragOver ? " pay-dropzone--active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <IconUpload />
              <p className="pay-dropzone-text">
                Drag & drop or{" "}
                <span className="pay-dropzone-link">click to upload</span>
              </p>
              <p className="pay-dropzone-hint">PNG, JPG, WEBP — max. 5MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="pay-file-hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div className="pay-actions">
            <button type="submit" className="pay-btn-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit payment"}
            </button>
          </div>
        </form>
      </div>
      <style>{buyerModalAnimStyles}</style>
      <style>{`
        .pay-overlay {
          position: fixed; inset: 0; z-index: 85;
          background: rgba(5, 28, 74, 0.4);
          backdrop-filter: blur(3px);
          display: grid; place-items: center; padding: 16px;
        }
        .pay-modal {
          width: min(520px, 100%);
          max-height: min(92vh, 720px);
          overflow-y: auto;
          background: #fff; border-radius: 16px;
          border: 1px solid #d0deff;
          padding: 0 0 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pay-modal-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 22px 16px;
          border-bottom: 1px solid #edf2ff;
          background: #f7faff;
        }
        .pay-close {
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
        .pay-close:disabled { opacity: 0.5; cursor: not-allowed; }
        .pay-title { margin: 0; font-size: 22px; font-weight: 700; color: #051c4a; }
        .pay-inv-number {
          margin: 6px 0 0;
          font-size: 14px;
          color: #6a84b0;
          font-weight: 500;
        }
        .pay-modal form { padding: 0 22px; }
        .pay-amount-box {
          margin-top: 20px;
          padding: 18px 20px;
          border-radius: 12px;
          background: #f7faff;
          border: 1px solid #c9dcff;
          text-align: center;
        }
        .pay-amount-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6a84b0;
          margin-bottom: 8px;
        }
        .pay-amount-value {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          line-height: 1.15;
          color: #051c4a;
          letter-spacing: -0.02em;
        }
        .pay-amount-note {
          margin: 10px 0 0;
          font-size: 13px;
          color: #6a84b0;
          line-height: 1.45;
        }
        .pay-transfer-box {
          margin-top: 16px;
          padding: 16px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid #edf2ff;
        }
        .pay-section-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6a84b0;
          margin-bottom: 12px;
        }
        .pay-bank-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .pay-bca-icon { flex-shrink: 0; }
        .pay-bank-details { flex: 1; min-width: 0; }
        .pay-bank-name {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 700;
          color: #005baa;
        }
        .pay-account-number {
          margin: 0 0 2px;
          font-size: 20px;
          font-weight: 700;
          color: #051c4a;
          letter-spacing: 0.04em;
        }
        .pay-account-holder {
          margin: 0;
          font-size: 14px;
          color: #4a6490;
          font-weight: 500;
        }
        .pay-copy-btn {
          flex-shrink: 0;
          border: 1px solid #c9dcff;
          border-radius: 8px;
          padding: 6px 12px;
          background: #fff;
          color: #0b47b8;
          font-size: 12px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
        }
        .pay-copy-btn:hover { background: #f7faff; }
        .pay-hint {
          margin: 16px 0 18px;
          font-size: 14px;
          line-height: 1.55;
          color: #4a6490;
        }
        .pay-dropzone {
          margin-top: 8px;
          padding: 36px 24px;
          border: 2px dashed #c9dcff;
          border-radius: 12px;
          background: #fafbff;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .pay-dropzone:hover,
        .pay-dropzone--active {
          border-color: #0b47b8;
          background: #f0f6ff;
        }
        .pay-dropzone-text {
          margin: 12px 0 6px;
          font-size: 15px;
          font-weight: 600;
          color: #4a6490;
        }
        .pay-dropzone-link {
          color: #0b47b8;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .pay-dropzone-hint {
          margin: 0;
          font-size: 13px;
          color: #9aa8c7;
        }
        .pay-file-hidden { display: none; }
        .pay-proof-preview {
          margin-top: 8px;
          display: flex;
          gap: 14px;
          align-items: center;
          padding: 12px;
          border: 1px solid #c9dcff;
          border-radius: 12px;
          background: #f7faff;
        }
        .pay-proof-img {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #d0deff;
          flex-shrink: 0;
        }
        .pay-proof-name {
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #051c4a;
          word-break: break-all;
        }
        .pay-proof-change {
          border: none;
          background: none;
          padding: 0;
          color: #0b47b8;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .pay-error {
          margin: 0 0 12px; padding: 10px 12px; border-radius: 8px;
          background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; font-size: 13px;
        }
        .pay-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
        .pay-btn-primary, .pay-btn-secondary {
          border-radius: 999px; padding: 10px 20px; font-size: 14px; font-weight: 700;
          font-family: inherit; cursor: pointer;
        }
        .pay-btn-primary { border: none; background: #16a34a; color: #fff; }
        .pay-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 420px) {
          .pay-amount-value { font-size: 26px; }
          .pay-bank-row { flex-wrap: wrap; }
          .pay-copy-btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
