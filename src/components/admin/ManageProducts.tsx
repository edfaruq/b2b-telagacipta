"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { alertFailBanner } from "@/lib/alertFailBanner";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { formatNumberFieldValue } from "@/lib/number-input";

// ─── Design tokens — identik dengan halaman admin ────────────────────────────
const font = '"Plus Jakarta Sans", sans-serif';

const c = {
  primary:     "#0B47B8",
  text:        "#051C4A",
  text2:       "#1A3566",
  text3:       "#4A6490",
  muted:       "#6A84B0",
  muted2:      "#9aa8c7",
  border:      "#d0deff",
  borderInner: "#edf2ff",
  borderSoft:  "#dbe7ff",
  borderLight: "#c9dcff",
  bg:          "#f7faff",
  card:        "#ffffff",
  greenBg:     "#ecfdf3",
  greenBorder: "#bbf7d0",
  greenText:   "#166534",
  amberBg:     "#fffbeb",
  amberBorder: "#fde68a",
  amberText:   "#92400e",
};

// ─── SVG icons — stroke 1.8, identik dengan parent ───────────────────────────
const IconPackage = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <span style={{ display: "inline-flex", animation: spinning ? "spin 0.9s linear infinite" : "none" }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M20 4v6h-6M4 20v-6h6M6.5 9A7 7 0 0119 10M17.5 15A7 7 0 015 14"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </span>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconPhoto = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
const IconHome = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const IconCoin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.7 10.6 8 12 8s2.5.7 2.5 1.5S13.4 11 12 11s-2.5.7-2.5 1.5S10.6 16 12 16s2.5-.7 2.5-1.5"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
export type AdminProductRow = {
  id_produk:         number;
  nama_produk:       string;
  slug:              string;
  deskripsi_singkat: string;
  deskripsi:         string;
  asal_produk:       string;
  satuan:            string;
  harga_indikatif:   string | number;
  stok:              number;
  foto_produk:       string;
  is_favorite:       number | boolean;
  status:            string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtRp(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0);
}

// ─── Input style ─────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: "14px",
  border: `1px solid ${c.borderSoft}`, borderRadius: "8px",
  color: c.text2, background: "#fff", outline: "none",
  fontFamily: font, boxSizing: "border-box",
};

// ─── Toggle (identik dengan CreateProduct & parent) ───────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        position: "relative", width: 40, height: 22,
        borderRadius: 999, border: "none", cursor: "pointer",
        flexShrink: 0, padding: 0,
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

// ─── Card header — identik dengan "All Users" card di parent ─────────────────
function Card({ title, icon, action, children }: {
  title: string; icon: ReactNode; action?: ReactNode; children: ReactNode;
}) {
  return (
    <div style={{
      background: c.card, border: `1px solid ${c.border}`, borderRadius: 12,
      overflow: "hidden", marginBottom: 16, boxShadow: "0 4px 18px rgba(10,40,120,0.08)",
    }}>
      <div style={{
        padding: "12px 14px", borderBottom: `1px solid ${c.borderInner}`,
        fontWeight: 600, color: c.text, fontSize: 15,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: c.primary, display: "inline-flex" }}>{icon}</span>
          {title}
        </span>
        {action}
      </div>
      <div style={{ padding: "14px 14px" }}>{children}</div>
    </div>
  );
}

// ─── Field label — uppercase + letterSpacing seperti thead parent ─────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600, color: c.muted,
        marginBottom: 6, fontFamily: font, textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ margin: "5px 0 0", fontSize: 11, color: c.muted2, fontFamily: font }}>{hint}</p>}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ManageProducts() {
  const [rows, setRows]       = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminProductRow | null>(null);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef               = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isWelcomeHover, setIsWelcomeHover] = useState(false);

  const [form, setForm] = useState({
    nama_produk: "", deskripsi_singkat: "", deskripsi: "",
    asal_produk: "", satuan: "kg", harga_indikatif: "", stok: "",
    is_favorite: false, status: "active" as "active" | "draft",
  });
  const set = (key: keyof typeof form, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/products", { cache: "no-store" });
      const data = (await res.json()) as { products?: AdminProductRow[]; message?: string };
      if (!res.ok) { setError(data.message ?? "Failed to load products."); setRows([]); return; }
      setRows((data.products ?? []) as AdminProductRow[]);
    } catch {
      setError("Could not reach the server."); setRows([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (row: AdminProductRow) => {
    setSaveMsg(null); setNewFile(null); setPreview(null);
    setEditing(row);
    setForm({
      nama_produk:       row.nama_produk,
      deskripsi_singkat: row.deskripsi_singkat ?? "",
      deskripsi:         row.deskripsi ?? "",
      asal_produk:       row.asal_produk,
      satuan:            row.satuan || "kg",
      harga_indikatif:   formatNumberFieldValue(row.harga_indikatif, "amount"),
      stok:              formatNumberFieldValue(row.stok),
      is_favorite:       row.is_favorite === 1 || row.is_favorite === true,
      status:            row.status === "draft" ? "draft" : "active",
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeEdit = () => {
    setEditing(null); setPreview(null); setNewFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setNewFile(file);
    setPreview((prev) => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setSaveMsg(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === "boolean") fd.append(k, v ? "1" : "0");
      else fd.append(k, String(v));
    });
    if (newFile) fd.append("foto_produk", newFile);
    try {
      const res  = await fetch(`/api/admin/products/${editing.id_produk}`, { method: "PATCH", body: fd });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) { setSaveMsg({ ok: false, text: body.message ?? "Failed to save." }); return; }
      await load();
      closeEdit();
    } catch {
      setSaveMsg({ ok: false, text: "Could not reach the server." });
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!(
    form.nama_produk.trim() && form.deskripsi_singkat.trim() &&
    form.asal_produk.trim() && form.harga_indikatif.trim() && form.stok.trim()
  );

  // pill button style — identik dengan Approve/Reject/Refresh di parent
  const pill = (bg: string, color: string, border?: string): React.CSSProperties => ({
    border: border ? `1px solid ${border}` : "none",
    borderRadius: "999px", background: bg, color,
    cursor: "pointer", display: "inline-flex", alignItems: "center",
    gap: 6, fontWeight: 600, fontSize: 13, fontFamily: font,
    padding: "5px 11px",
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
        .overlay-anim { animation: fadeIn 0.22s ease both; }
        .modal-anim { animation: fadeInUp 0.26s ease both; }
        .spinning { display: inline-flex; animation: spin 0.9s linear infinite; }
        .mp-table-row { transition: background 0.15s ease; }
        .mp-table-row:hover { background: #f0f6ff !important; }
        .mp-btn-refresh { transition: background 0.15s, color 0.15s, box-shadow 0.15s, transform 0.12s; }
        .mp-btn-refresh:hover { background: #eef4ff !important; box-shadow: 0 2px 8px rgba(11,71,184,0.1) !important; transform: scale(1.03); }
        .mp-btn-refresh:active { transform: scale(0.97); }
        .mp-btn-edit { transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.12s; }
        .mp-btn-edit:hover { background: #eef4ff !important; border-color: #93b4ff !important; box-shadow: 0 2px 8px rgba(11,71,184,0.12) !important; transform: scale(1.03); }
        .mp-btn-edit:active { transform: scale(0.97); }
        .mp-btn-save { transition: background 0.15s, box-shadow 0.15s, transform 0.12s; }
        .mp-btn-save:hover:not(:disabled) { background: #0d3fa0 !important; box-shadow: 0 3px 10px rgba(11,71,184,0.3) !important; transform: scale(1.04); }
        .mp-btn-save:active:not(:disabled) { transform: scale(0.97); }
        .mp-btn-save:disabled { opacity: 0.55; cursor: not-allowed; }
        .mp-status-btn { transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.12s; }
        .mp-status-btn:hover { transform: scale(1.02); }
        input:focus, select:focus, textarea:focus {
          border-color: ${c.primary} !important;
          box-shadow: 0 0 0 3px rgba(11,71,184,0.12) !important;
        }
      `}</style>

      {/* ── Page header — staggered seperti Approval Users ── */}
      <div className="card-anim-2" style={{ marginBottom: 20 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 30, color: c.text, fontFamily: font }}>
          Manage Products
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: c.muted, fontFamily: font }}>
          Full product list. Click <strong>Edit</strong> to update a row.
        </p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          ...alertFailBanner,
          marginBottom: 14, fontFamily: font,
          animation: "fadeInUp 0.25s ease both",
        }}>
          <IconX /> {error}
        </div>
      )}

      {/* ── Products card — card-anim-3 = kartu kedua bergeser seperti Pending Approvals ── */}
      <div className="admin-table-card card-anim-3">
        <div className="admin-table-card__head">
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: c.primary, display: "inline-flex" }}><IconPackage /></span>
            All Products
            {rows.length > 0 && <span className="acct-count-badge">{rows.length}</span>}
          </span>
          <button
            type="button"
            className="acct-btn acct-btn--ghost"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <IconRefresh spinning={refreshing} />
            Refresh
          </button>
        </div>

        {/* table body */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 14px", color: c.muted, fontFamily: font }}>
            <span className="spinning" style={{ display: "inline-flex" }}>
              <IconRefresh />
            </span>
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "28px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: c.muted }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.35">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                stroke="#6A84B0" strokeWidth="1.5"/>
            </svg>
            <p style={{ margin: 0, fontSize: 14, fontFamily: font }}>No products yet. Add some from Create Product.</p>
          </div>
        ) : (
          <table className="admin-data-table admin-table--responsive">
            <colgroup>
              <col className="col-photo" />
              <col className="col-name" />
              <col className="col-origin" />
              <col className="col-price" />
              <col className="col-stock" />
              <col className="col-curated" />
              <col className="col-status" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Origin</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Curated</th>
                <th>Status</th>
                <th className="admin-th-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id_produk} className="table-row">
                  {/* Foto */}
                  <td data-label="Photo">
                    <div style={{
                      width: 44, height: 44, borderRadius: 8, overflow: "hidden",
                      background: "#e5e7eb", flexShrink: 0,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.foto_produk || "/images/logo-telagacipta.png"}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </td>
                  {/* Nama */}
                  <td data-label="Name" className="cell-clip" style={{ fontWeight: 600, color: c.text }} title={r.nama_produk}>{r.nama_produk}</td>
                  {/* Asal */}
                  <td data-label="Origin" className="cell-clip" style={{ color: c.text3 }} title={r.asal_produk}>{r.asal_produk}</td>
                  {/* Price + unit */}
                  <td data-label="Price" className="cell-clip" style={{ color: c.text2 }}>
                    <span style={{ fontWeight: 600 }}>{fmtRp(r.harga_indikatif)}</span>
                    <span style={{ color: c.muted, fontSize: 12, fontWeight: 500, marginLeft: 6 }}>
                      / {r.satuan?.trim() || "kg"}
                    </span>
                  </td>
                  {/* Stok */}
                  <td data-label="Stock" className="cell-clip" style={{ color: c.text3 }}>{r.stok}</td>
                  {/* Curated (favorite) — Latest homepage otomatis 4 terbaru */}
                  <td data-label="Curated">
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {(r.is_favorite === 1 || r.is_favorite === true) ? (
                        <span style={{
                          background: c.amberBg, color: c.amberText, border: `1px solid ${c.amberBorder}`,
                          borderRadius: "999px", padding: "2px 9px", fontSize: 11, fontWeight: 700,
                        }}>Curated</span>
                      ) : (
                        <span style={{ fontSize: 12, color: c.muted2 }}>—</span>
                      )}
                    </div>
                  </td>
                  {/* Status — FULL CAPITAL */}
                  <td data-label="Status">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      borderRadius: "999px", padding: "4px 10px",
                      fontSize: 12, fontWeight: 700, fontFamily: font,
                      whiteSpace: "nowrap",
                      background:   r.status === "active" ? c.greenBg   : "#d1d5db",
                      color:        r.status === "active" ? c.greenText  : "#111827",
                      border:       r.status === "active" ? `1px solid ${c.greenBorder}` : "1px solid #9ca3af",
                    }}>
                      {r.status === "active" ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  {/* Edit button — sama gaya Details button di parent */}
                  <td className="admin-td-actions" data-label="Action">
                    <button
                      type="button"
                      className="acct-btn acct-btn--outline"
                      onClick={() => openEdit(r)}
                    >
                      <IconEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ Edit Modal — sama struktur dengan Detail Modal di parent ══════════ */}
      {editing && (
        <div
          role="presentation"
          className="overlay-anim"
          style={{
            position: "fixed", inset: 0, zIndex: 80,
            background: "rgba(5, 28, 74, 0.40)",
            backdropFilter: "blur(3px)",
            display: "grid", placeItems: "center", padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="edit-prod-title"
            className="modal-anim"
            style={{
              width: "min(800px, 100%)",
              maxHeight: "min(92vh, 900px)",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 16,
              border: `1px solid ${c.border}`,
              boxShadow: "0 20px 50px rgba(10,40,120,0.22)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header — identik dengan Detail Modal di parent */}
            <div style={{
              padding: "14px 18px", borderBottom: `1px solid ${c.borderInner}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: c.bg,
            }}>
              <span style={{ fontWeight: 700, color: c.text, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: c.primary, display: "inline-flex" }}><IconEdit /></span>
                <span id="edit-prod-title">Edit product</span>
              </span>
              <button
                type="button"
                onClick={closeEdit}
                aria-label="Close"
                style={{
                  border: `1px solid ${c.border}`, borderRadius: "999px",
                  background: "#fff", color: c.muted, cursor: "pointer",
                  display: "inline-flex", padding: 5, transition: "all 0.15s",
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
            </div>

            {/* Meta info */}
            <div style={{ padding: "10px 18px 0", borderBottom: `1px solid ${c.borderInner}` }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: c.muted, fontFamily: font }}>
                Slug URL:{" "}
                <code style={{
                  fontSize: 11, background: "#f7faff", border: `1px solid ${c.borderInner}`,
                  borderRadius: 4, padding: "1px 6px", color: c.text2,
                }}>
                  {editing.slug}
                </code>
                {" "}(fixed; buyer links stay the same)
              </p>
            </div>

            {/* Save message */}
            {saveMsg && (
              <div style={{
                margin: "10px 18px 0", fontFamily: font,
                ...(saveMsg.ok
                  ? {
                    padding: "10px 14px", borderRadius: 8,
                    background: c.greenBg, border: `1px solid ${c.greenBorder}`,
                    color: c.greenText, fontSize: 13, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 8,
                  }
                  : {
                    ...alertFailBanner,
                  }),
              }}>
                {saveMsg.ok ? <IconCheck /> : <IconX />}
                {saveMsg.text}
              </div>
            )}

            {/* Modal body */}
            <div style={{ padding: "16px 18px", overflowY: "auto", maxHeight: "calc(92vh - 180px)" }}>
              <form onSubmit={handleSubmit}>
                {/* ── Informasi Produk ── */}
                <Card title="Product information" icon={<IconUsers />}>
                  <Field label="Product name" required>
                    <input style={inputBase} value={form.nama_produk} required
                      onChange={(e) => set("nama_produk", e.target.value)} />
                  </Field>
                  <Field label="Short description" required>
                    <textarea style={{ ...inputBase, minHeight: 62, resize: "vertical" }}
                      maxLength={100} value={form.deskripsi_singkat} required
                      onChange={(e) => set("deskripsi_singkat", e.target.value)} />
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
                  <Field label="Full description" hint="Optional">
                    <textarea style={{ ...inputBase, minHeight: 88, resize: "vertical" }}
                      value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} />
                  </Field>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Origin / region" required>
                      <input style={inputBase} value={form.asal_produk} required
                        onChange={(e) => set("asal_produk", e.target.value)} />
                    </Field>
                    <Field label="Unit">
                      <select style={{ ...inputBase, cursor: "pointer" }} value={form.satuan}
                        onChange={(e) => set("satuan", e.target.value)}>
                        <option value="kg">per kg</option>
                        <option value="ton">per ton</option>
                        <option value="gram">per gram</option>
                      </select>
                    </Field>
                  </div>
                </Card>

                {/* ── Harga & Stok ── */}
                <Card title="Price & stock" icon={<IconCoin />}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Indicative price" required>
                      <div style={{ display: "flex" }}>
                        <span style={{
                          padding: "9px 11px", fontSize: 13, color: c.muted, userSelect: "none",
                          background: c.bg, border: `1px solid ${c.borderSoft}`,
                          borderRight: "none", borderRadius: "8px 0 0 8px", fontFamily: font,
                        }}>Rp</span>
                        <FormattedNumberInput mode="amount" required
                          style={{ ...inputBase, borderRadius: "0 8px 8px 0" }}
                          value={form.harga_indikatif}
                          onChange={(v) => set("harga_indikatif", v)} />
                      </div>
                    </Field>
                    <Field label={`Stock (${form.satuan})`} required>
                      <FormattedNumberInput required style={inputBase} value={form.stok}
                        onChange={(v) => set("stok", v)} />
                    </Field>
                  </div>
                </Card>

                {/* ── Foto Produk ── */}
                <Card title="Product photo" icon={<IconPhoto />}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{
                      width: 96, height: 96, borderRadius: 10, overflow: "hidden",
                      border: `1px solid ${c.borderSoft}`, flexShrink: 0,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview ?? (editing.foto_produk?.trim() ? editing.foto_produk : "/images/logo-telagacipta.png")}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                          ...pill("#f7faff", c.primary, c.borderLight),
                          padding: "8px 14px",
                        }}
                      >
                        <IconPhoto /> Change photo…
                      </button>
                      {newFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewFile(null);
                            setPreview((prev) => { if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev); return null; });
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          style={{ ...pill("#fef2f2", "#dc2626", "#fecaca"), fontSize: 12 }}
                        >
                          <IconX /> Cancel
                        </button>
                      )}
                      <p style={{ margin: 0, fontSize: 11, color: c.muted2, fontFamily: font }}>
                        Leave empty to keep the current image.
                      </p>
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                </Card>

                {/* ── Status & Homepage ── */}
                <Card title="Status & homepage" icon={<IconEye />}>
                  {/* Status buttons */}
                  <Field label="Product status">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 0 }}>
                      {(["active", "draft"] as const).map((s) => {
                        const selected = form.status === s;
                        const activeSelected = selected && s === "active";
                        const draftSelected = selected && s === "draft";
                        return (
                        <button key={s} type="button" className="mp-status-btn"
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
                          {s === "active" ? <><IconCheck /> ACTIVE</> : <><IconDraftBox /> DRAFT</>}
                        </button>
                        );
                      })}
                    </div>
                  </Field>

                  {/* Homepage — Latest otomatis; admin hanya Favorite */}
                  <div style={{ borderTop: `1px solid ${c.borderInner}`, paddingTop: 14 }}>
                    <p style={{
                      margin: "0 0 14px", padding: "10px 12px", borderRadius: 8, fontSize: 12, color: c.text3,
                      fontFamily: font, lineHeight: 1.55, background: "#f7faff", border: `1px solid ${c.borderInner}`,
                    }}>
                      <strong style={{ color: c.text2 }}>Latest</strong> on the homepage is the{" "}
                      <strong style={{ color: c.primary }}>4 newest active products</strong> (automatic).
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.text, fontFamily: font }}>Favorite Products</p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted2, fontFamily: font }}>
                          Appears in the{" "}
                          <span style={{ background: c.amberBg, color: c.amberText, border: `1px solid ${c.amberBorder}`, borderRadius: "999px", padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                            Curated
                          </span>
                          {" "}section
                        </p>
                      </div>
                      <Toggle checked={form.is_favorite} onChange={(v) => set("is_favorite", v)} />
                    </div>
                  </div>
                </Card>

                {/* ── Modal footer — identik dengan Detail Modal footer di parent ── */}
                <div style={{
                  display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4,
                }}>
                  <button type="submit" className="mp-btn-save"
                    disabled={saving || !canSave}
                    style={{
                      ...pill(c.primary, "#fff"),
                      boxShadow: "0 3px 10px rgba(11,71,184,0.25)",
                      opacity: saving || !canSave ? 0.55 : 1,
                      cursor: saving || !canSave ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? (
                      <>
                        <span className="spinning" style={{ display: "inline-flex" }}><IconSave /></span>
                        Saving…
                      </>
                    ) : (
                      <>
                        <IconSave />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}