"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";

// ─── Design tokens (sama persis dengan halaman admin) ─────────────────────────
const font = '"Plus Jakarta Sans", sans-serif';

const c = {
  primary:      "#0B47B8",
  text:         "#051C4A",
  text2:        "#1A3566",
  text3:        "#4A6490",
  muted:        "#6A84B0",
  muted2:       "#9aa8c7",
  border:       "#d0deff",
  borderInner:  "#edf2ff",
  borderSoft:   "#dbe7ff",
  borderLight:  "#c9dcff",
  bg:           "#f7faff",
  card:         "#ffffff",
  greenBg:      "#ecfdf3",
  greenBorder:  "#bbf7d0",
  greenText:    "#166534",
  amberBg:      "#fffbeb",
  amberBorder:  "#fde68a",
  amberText:    "#92400e",
};

// ─── SVG icons — stroke 1.8, identik dengan icon di halaman admin ─────────────
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCoin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.7 10.6 8 12 8s2.5.7 2.5 1.5S13.4 11 12 11s-2.5.7-2.5 1.5S10.6 16 12 16s2.5-.7 2.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconPhoto = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const IconHome = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
/** Outline package / empty storage — Draft status */
const IconDraftBox = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconUpload = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#6A84B0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────
type ProductForm = {
  nama_produk:       string;
  deskripsi_singkat: string;
  deskripsi:         string;
  asal_produk:       string;
  satuan:            string;
  harga_indikatif:   string;
  stok:              string;
  foto_produk:       File | null;
  is_favorite:       boolean;
  status:            "active" | "draft";
};

const initialForm = (): ProductForm => ({
  nama_produk: "", deskripsi_singkat: "", deskripsi: "",
  asal_produk: "", satuan: "kg", harga_indikatif: "", stok: "",
  foto_produk: null, is_favorite: false, status: "active",
});

// ─── Input style (14px, sama dengan font size tabel di parent) ────────────────
const inputBase: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: "14px",
  border: `1px solid ${c.borderSoft}`, borderRadius: "8px",
  color: c.text2, background: "#fff", outline: "none",
  fontFamily: font, boxSizing: "border-box",
};

// ─── Toggle (pill, warna primary sama dengan nav active di parent) ─────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        position: "relative", width: 40, height: 22, borderRadius: 999,
        border: "none", cursor: "pointer", flexShrink: 0, padding: 0,
        background: checked ? c.primary : "#d0deff",
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 20 : 4,
        width: 16, height: 16, borderRadius: 999, background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left 0.2s",
      }} />
    </button>
  );
}

// ─── Card — header identik dengan "All Users" card di parent ──────────────────
function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="cp-card" style={{
      background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
      overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 18px rgba(10,40,120,0.08)",
    }}>
      <div style={{
        padding: "12px 14px", borderBottom: `1px solid ${c.borderInner}`,
        fontWeight: 600, color: c.text, fontSize: 15,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ color: c.primary, display: "inline-flex" }}>{icon}</span>
        {title}
      </div>
      <div style={{ padding: "14px 14px" }}>{children}</div>
    </div>
  );
}

// ─── Field label — uppercase + letterSpacing seperti thead di parent ──────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600, color: c.muted,
        marginBottom: 6, fontFamily: font, textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: "5px 0 0", fontSize: 11, color: c.muted2, fontFamily: font }}>{hint}</p>}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function CreateProduct() {
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm]               = useState<ProductForm>(initialForm);
  const [isWelcomeHover, setIsWelcomeHover] = useState(false);

  const set = (key: keyof ProductForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = (file: File | null) => {
    if (!file) return;
    set("foto_produk", file);
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  };

  const resetForm = () => {
    setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setForm(initialForm());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(""); setSuccess(false); setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v instanceof File)           data.append(k, v);
      else if (typeof v === "boolean") data.append(k, v ? "1" : "0");
      else if (v !== null)             data.append(k, String(v));
    });
    try {
      const res  = await fetch("/api/admin/products", { method: "POST", body: data });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) { setSubmitError(body.message ?? "Failed to save product."); return; }
      setSuccess(true);
      resetForm();
    } catch {
      setSubmitError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const missingForSubmit = [
    !form.nama_produk      && "Product name",
    !form.harga_indikatif  && "Price",
    !form.stok             && "Stock",
    !form.foto_produk      && "Photo",
  ].filter(Boolean) as string[];

  const missingAll = [
    ...missingForSubmit,
    !form.deskripsi_singkat && "Short description",
    !form.asal_produk       && "Origin / region",
  ].filter(Boolean) as string[];

  // shared pill-button style — sama persis dengan Approve/Reject/Refresh di parent
  const pillBtn = (bg: string, color: string, borderColor?: string): React.CSSProperties => ({
    border: borderColor ? `1px solid ${borderColor}` : 0,
    borderRadius: "999px",
    background: bg,
    color,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    fontSize: "13px",
    fontFamily: font,
    padding: "8px 14px",
  });

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .card-anim { animation: fadeInUp 0.38s ease both; }
        .card-anim-2 { animation: fadeInUp 0.38s 0.1s ease both; }
        .card-anim-3 { animation: fadeInUp 0.38s 0.2s ease both; }
        .spinning { display: inline-flex; animation: spin 0.9s linear infinite; }
        .cp-cols { display: flex; gap: 16px; align-items: flex-start; width: 100%; max-width: 100%; }
        .cp-left  { flex: 1; min-width: 0; }
        .cp-right { width: 282px; flex-shrink: 0; }
        .cp-btn-reset { transition: background 0.15s, box-shadow 0.15s, transform 0.12s; }
        .cp-btn-reset:hover  { background: #eef4ff !important; box-shadow: 0 2px 8px rgba(11,71,184,0.1) !important; transform: scale(1.03); }
        .cp-btn-reset:active { transform: scale(0.97); }
        .cp-btn-save  { transition: background 0.15s, box-shadow 0.15s, transform 0.12s; }
        .cp-btn-save:hover:not(:disabled)  { background: #0d3fa0 !important; box-shadow: 0 3px 10px rgba(11,71,184,0.3) !important; transform: scale(1.04); }
        .cp-btn-save:active:not(:disabled) { transform: scale(0.97); }
        .cp-btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
        .cp-status-btn { transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.12s; }
        .cp-status-btn:hover { transform: scale(1.03); }
        .cp-upload { transition: border-color 0.15s, background 0.15s; }
        .cp-upload:hover { border-color: #0B47B8 !important; background: #eef4ff !important; }
        input:focus, select:focus, textarea:focus {
          border-color: #0B47B8 !important;
          box-shadow: 0 0 0 3px rgba(11,71,184,0.12) !important;
        }
        @media (max-width: 1020px) {
          .cp-cols { flex-direction: column; align-items: stretch; }
          .cp-left, .cp-right { width: 100%; max-width: 100%; }
          .cp-right { width: 100% !important; }
        }
        @media (max-width: 900px) {
          .cp-card {
            margin-left: -12px;
            margin-right: -12px;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }
        @media (max-width: 540px) {
          .cp-card {
            margin-left: -8px;
            margin-right: -8px;
          }
        }
        .cp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 540px) {
          .cp-field-row { grid-template-columns: 1fr; }
        }
      `}</style>


      {/* ── Page header — staggered seperti Approval Users ── */}
      <div className="card-anim-2" style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "30px", color: c.text, fontFamily: font }}>
          Create Products
        </h1>
        <p style={{ margin: 0, fontSize: "15px", color: c.muted, fontFamily: font }}>
          Add a new product to the marketplace catalog.
        </p>
      </div>

      {/* ── Success banner — sama gaya info banner di parent ── */}
      {success && (
        <div style={{
          marginBottom: 14, padding: "10px 14px", borderRadius: 8, fontFamily: font,
          background: c.greenBg, border: `1px solid ${c.greenBorder}`,
          color: c.greenText, fontSize: 14, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
          animation: "fadeInUp 0.25s ease both",
        }}>
          <IconCheck />
          Product saved. The form was cleared — you can add another one.
        </div>
      )}

      {/* ── Error banner ── */}
      {submitError && (
        <div style={{
          ...alertFailBanner,
          marginBottom: 14, fontFamily: font,
          animation: "fadeInUp 0.25s ease both",
        }}>
          <IconX />
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-anim-3">
        <div className="cp-cols">

          {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
          <div className="cp-left">

            {/* Informasi Produk */}
            <Card title="Product information" icon={<IconUsers />}>
              <Field label="Product name" required>
                <input style={inputBase} placeholder="e.g. Fresh Turmeric"
                  value={form.nama_produk} required
                  onChange={(e) => set("nama_produk", e.target.value)} />
              </Field>

              <Field label="Short description" required>
                <textarea
                  style={{ ...inputBase, minHeight: 62, resize: "vertical" }}
                  maxLength={100}
                  placeholder="e.g. Fresh turmeric with vibrant color for culinary and herbal use."
                  value={form.deskripsi_singkat} required
                  onChange={(e) => set("deskripsi_singkat", e.target.value)}
                />
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  gap: 12, marginTop: 5, fontFamily: font,
                }}>
                  <p style={{ margin: 0, fontSize: 11, color: c.muted2, flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                    Shown on product cards and the homepage — max. 100 characters
                  </p>
                  <span style={{ fontSize: 11, color: c.muted2, flexShrink: 0, lineHeight: 1.35 }}>
                    {form.deskripsi_singkat.length}/100
                  </span>
                </div>
              </Field>

              <Field label="Full description" hint="Shown on the product detail page. Optional.">
                <textarea
                  style={{ ...inputBase, minHeight: 96, resize: "vertical" }}
                  placeholder="Sourced from Central Java and prepared by Rempah Nusantara Solo..."
                  value={form.deskripsi}
                  onChange={(e) => set("deskripsi", e.target.value)}
                />
              </Field>

              <div className="cp-field-row">
                <Field label="Origin / region" required>
                  <input style={inputBase} placeholder="e.g. East Java"
                    value={form.asal_produk} required
                    onChange={(e) => set("asal_produk", e.target.value)} />
                </Field>
                <Field label="Unit">
                  <select style={{ ...inputBase, cursor: "pointer" }}
                    value={form.satuan} onChange={(e) => set("satuan", e.target.value)}>
                    <option value="kg">per kg</option>
                    <option value="ton">per ton</option>
                    <option value="gram">per gram</option>
                  </select>
                </Field>
              </div>
            </Card>

            {/* Harga & Stok */}
            <Card title="Price & stock" icon={<IconCoin />}>
              <div className="cp-field-row">
                <Field label="Indicative price" required hint="Price per unit">
                  <div style={{ display: "flex" }}>
                    <span style={{
                      padding: "9px 11px", fontSize: 13, color: c.muted, userSelect: "none",
                      background: c.bg, border: `1px solid ${c.borderSoft}`,
                      borderRight: "none", borderRadius: "8px 0 0 8px", fontFamily: font,
                    }}>Rp</span>
                    <FormattedNumberInput mode="amount" required
                      style={{ ...inputBase, borderRadius: 0, borderLeft: "none", borderRight: "none" }}
                      placeholder="0" value={form.harga_indikatif}
                      onChange={(v) => set("harga_indikatif", v)} />
                    <span style={{
                      padding: "9px 10px", fontSize: 13, color: c.muted, userSelect: "none",
                      background: c.bg, border: `1px solid ${c.borderSoft}`,
                      borderLeft: "none", borderRadius: "0 8px 8px 0", whiteSpace: "nowrap", fontFamily: font,
                    }}>/{form.satuan}</span>
                  </div>
                </Field>
                <Field label={`Stock (${form.satuan})`} required hint="Max. order quantity equals stock">
                  <FormattedNumberInput required style={inputBase} placeholder="0"
                    value={form.stok}
                    onChange={(v) => set("stok", v)} />
                </Field>
              </div>
            </Card>

            {/* Foto Produk */}
            <Card title="Product photo" icon={<IconPhoto />}>
              {previewUrl ? (
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Product preview"
                    style={{
                      width: "100%", height: 210, objectFit: "cover", display: "block",
                      borderRadius: 10, border: `1px solid ${c.borderInner}`,
                    }} />
                  {/* close button — sama persis gaya close modal di parent */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
                      set("foto_produk", null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    style={{
                      position: "absolute", top: 10, right: 10,
                      width: 30, height: 30, borderRadius: 999,
                      border: `1px solid ${c.border}`, background: "#fff",
                      cursor: "pointer", display: "inline-flex",
                      alignItems: "center", justifyContent: "center",
                      color: c.muted, transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "#fef2f2"; b.style.borderColor = "#fecaca"; b.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.background = "#fff"; b.style.borderColor = c.border; b.style.color = c.muted;
                    }}
                  >
                    <IconX />
                  </button>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: c.muted2, textAlign: "center", fontFamily: font }}>
                    Click ✕ to change the photo
                  </p>
                </div>
              ) : (
                <div
                  className="cp-upload"
                  role="button" tabIndex={0}
                  onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") fileInputRef.current?.click(); }}
                  style={{
                    border: `2px dashed ${c.borderSoft}`, borderRadius: 12,
                    padding: "38px 24px", textAlign: "center", cursor: "pointer", background: "#fafbff",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(ev) => ev.preventDefault()}
                >
                  <IconUpload />
                  <p style={{ margin: "10px 0 4px", fontSize: 14, color: c.muted, fontWeight: 600, fontFamily: font }}>
                    Drag & drop or{" "}
                    <span style={{ color: c.primary, textDecoration: "underline", textUnderlineOffset: 3 }}>
                      click to upload
                    </span>
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: c.muted2, fontFamily: font }}>PNG, JPG, WEBP — max. 5MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
            </Card>
          </div>

          {/* ══ RIGHT ═════════════════════════════════════════════════════════ */}
          <div className="cp-right">

            {/* Status Produk */}
            <Card title="Product status" icon={<IconEye />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["active", "draft"] as const).map((s) => {
                  const selected = form.status === s;
                  const activeSelected = selected && s === "active";
                  const draftSelected = selected && s === "draft";
                  return (
                  <button key={s} type="button" className="cp-status-btn"
                    onClick={() => set("status", s)}
                    style={{
                      padding: "8px", borderRadius: "999px", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: font,
                      border: draftSelected
                        ? "1px solid #9ca3af"
                        : activeSelected
                          ? `1px solid ${c.greenBorder}`
                          : `1px solid ${c.borderLight}`,
                      background: draftSelected ? "#d1d5db" : activeSelected ? c.greenBg : "#ffffff",
                      color: draftSelected ? "#111827" : activeSelected ? c.greenText : c.muted,
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                      boxShadow: draftSelected
                        ? "0 2px 8px rgba(17, 24, 39, 0.12)"
                        : activeSelected
                          ? "0 3px 10px rgba(22, 163, 74, 0.28)"
                          : "none",
                    }}
                  >
                    {s === "active" ? <><IconCheck /> Active</> : <><IconDraftBox /> Draft</>}
                  </button>
                  );
                })}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 12, color: c.muted2, fontFamily: font }}>
                {form.status === "draft" ? "Draft products are hidden from the buyer site." : "Active products appear on the buyer site after you save."}
              </p>
            </Card>

            {/* Homepage — admin mengatur Favorite */}
            <Card title="Homepage visibility" icon={<IconHome />}>
              {/* Favorite */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                gap: 12,
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, fontFamily: font }}>
                    Favorite Products
                  </p>
                  <p style={{ margin: "5px 0 0", fontSize: 12, color: c.muted2, fontFamily: font, lineHeight: 1.5 }}>
                    Appears in the{" "}
                    <span style={{
                      background: c.amberBg, color: c.amberText, border: `1px solid ${c.amberBorder}`,
                      borderRadius: "999px", padding: "2px 9px", fontSize: 11, fontWeight: 700,
                    }}>Favorite</span>{" "}
                    section on the homepage
                  </p>
                </div>
                <Toggle checked={form.is_favorite} onChange={(v) => set("is_favorite", v)} />
              </div>
            </Card>

            {/* Ringkasan */}
            <Card title="Summary" icon={<IconList />}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, fontFamily: font }}>
                {([
                  ["Status",   form.status === "active" ? "Active" : "Draft", form.status === "active" ? c.greenText : c.muted],
                  ["Favorite", form.is_favorite  ? "Yes" : "No", form.is_favorite  ? "#b45309" : c.muted2],
                  ["Photo",    form.foto_produk  ? form.foto_produk.name : "Not uploaded", form.foto_produk ? c.greenText : c.muted2],
                ] as [string, string, string][]).map(([k, v, vColor]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span style={{ color: c.muted }}>{k}</span>
                    <span style={{
                      color: vColor, fontWeight: 600, textAlign: "right",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130,
                    }}>{v}</span>
                  </div>
                ))}
              </div>

              {missingAll.length > 0 && (
                <div style={{
                  ...alertFailBanner,
                  marginTop: 12, marginBottom: 0, fontFamily: font,
                  flexDirection: "column", alignItems: "stretch", gap: 4,
                }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>
                    Missing:
                  </p>
                  {missingAll.map((m) => (
                    <p key={m} style={{ margin: 0, fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.88)" }}>• {m}</p>
                  ))}
                </div>
              )}
            </Card>

            {/* Action buttons — pill, sama persis gaya Approve/Reject/Refresh di parent */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="cp-btn-reset"
                onClick={() => { setSubmitError(""); setSuccess(false); resetForm(); }}
                style={pillBtn("#ffffff", c.primary, c.borderLight)}
              >
                <IconX /> Reset
              </button>
              <button
                type="submit"
                className="cp-btn-save"
                disabled={loading || missingForSubmit.length > 0}
                style={{
                  ...pillBtn(c.primary, "#fff"),
                  flex: 1,
                  justifyContent: "center",
                  boxShadow: "0 3px 10px rgba(11,71,184,0.25)",
                  opacity: loading || missingForSubmit.length > 0 ? 0.55 : 1,
                  cursor: loading || missingForSubmit.length > 0 ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinning" style={{ display: "inline-flex" }}><IconSave /></span>
                    Saving…
                  </>
                ) : (
                  <>
                    <IconSave />
                    Save product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}