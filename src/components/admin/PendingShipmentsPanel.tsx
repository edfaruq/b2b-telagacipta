"use client";

import { useCallback, useEffect, useState } from "react";
import { alertFailBanner } from "@/lib/alertFailBanner";

type ShipmentRow = {
  id_pengiriman: number;
  id_invoice: number;
  status: string;
  statusLabel: string;
  trackingNumber: string;
  invoiceNumber: string;
  totalLabel: string;
  buyerName: string;
  buyerEmail: string;
  productName: string;
  expedition: string;
  deliveryAddress: string;
  canMarkShipped: boolean;
  canAutoGenerateAwb: boolean;
};

const shipAnimStyles = `
  @keyframes shipPageIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .ship-wrap { animation: shipPageIn 0.45s ease-out both; }
  .ship-table-row {
    opacity: 0;
    animation: shipPageIn 0.4s ease-out forwards;
  }
  .ship-tracking-input {
    width: 100%;
    min-width: 140px;
    padding: 8px 12px;
    border: 1px solid #c9dcff;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    color: #051c4a;
  }
  .ship-tracking-input:focus {
    outline: none;
    border-color: #0b47b8;
    box-shadow: 0 0 0 3px rgba(11, 71, 184, 0.12);
  }
  @media (max-width: 768px) {
    .ship-tracking-input {
      min-width: 0;
    }
  }
`;

const IconTruck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M1 3h13v11H1V3zm13 4h4l3 3v4h-7V7zM5 19a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <span className={spinning ? "spinning" : ""} style={{ display: "inline-flex" }}>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 4v6h-6M4 20v-6h6M6.5 9A7 7 0 0119 10M17.5 15A7 7 0 015 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

type Props = {
  embedded?: boolean;
  onActivity?: () => void;
};

export function PendingShipmentsPanel({ embedded = false, onActivity }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [trackingDraft, setTrackingDraft] = useState<Record<number, string>>({});
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/shipments", { cache: "no-store" });
      const data = (await res.json()) as {
        shipments?: ShipmentRow[];
        message?: string;
      };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to load shipments.");
        setMessageTone("error");
        setShipments([]);
        return;
      }
      const list = data.shipments ?? [];
      setShipments(list);
      setTrackingDraft((prev) => {
        const next = { ...prev };
        for (const row of list) {
          if (row.canMarkShipped && next[row.id_pengiriman] === undefined) {
            next[row.id_pengiriman] = row.trackingNumber;
          }
        }
        return next;
      });
      if (manual) setMessage("");
    } catch {
      setMessage("Could not reach the server.");
      setMessageTone("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleShip = async (row: ShipmentRow) => {
    const nomorResi = (trackingDraft[row.id_pengiriman] ?? "").trim();
    const autoGenerate = !nomorResi && row.canAutoGenerateAwb;

    if (!nomorResi && !autoGenerate) {
      setMessage(
        "Enter a tracking number or leave empty to generate a mock AWB (courier must be supported)."
      );
      setMessageTone("error");
      return;
    }

    const key = `ship-${row.id_pengiriman}`;
    setProcessingKey(key);
    setMessage("");
    try {
      const res = await fetch("/api/admin/shipments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_pengiriman: row.id_pengiriman,
          action: "ship",
          nomor_resi: nomorResi || undefined,
          auto_generate: autoGenerate,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to update shipment.");
        setMessageTone("error");
        return;
      }
      setMessage(data.message ?? "Shipment updated.");
      setMessageTone("success");
      await load();
      onActivity?.();
    } catch {
      setMessage("Could not reach the server.");
      setMessageTone("error");
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="ship-wrap">
      <style>{shipAnimStyles}</style>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { display: inline-block; animation: spin 0.9s linear infinite; }
      `}</style>

      {!embedded ? (
        <header>
          <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Manage Shipping</h1>
          <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
            Paid orders ready to ship. Enter AWB manually or leave empty to generate a mock AWB.
          </p>
        </header>
      ) : null}

      {message ? (
        <div
          style={{
            margin: "0 0 14px",
            ...(messageTone === "error"
              ? alertFailBanner
              : {
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: "14px",
                }),
          }}
        >
          {message}
        </div>
      ) : null}

      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#6a84b0" }}>
        Mock shipping is active. Empty tracking + Mark shipped will generate a mock AWB.
      </p>

      <div className="admin-table-card">
        <div className="admin-table-card__head">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconTruck />
            Active shipments
          </span>
          <button type="button" className="acct-btn acct-btn--ghost" onClick={() => load(true)}>
            <IconRefresh spinning={refreshing} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="admin-table-card__empty">
            <p style={{ margin: 0, color: "#6a84b0" }}>Loading…</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="admin-table-card__empty">
            <IconTruck />
            <p style={{ margin: "8px 0 0" }}>No orders awaiting shipment or in transit.</p>
          </div>
        ) : (
          <table className="admin-data-table admin-table--responsive">
            <thead>
              <tr>
                <th>Buyer / Invoice</th>
                <th>Product / Courier</th>
                <th>Status</th>
                <th>Tracking</th>
                <th className="admin-th-actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((row, index) => (
                <tr
                  key={row.id_pengiriman}
                  className="ship-table-row"
                  style={{ animationDelay: `${Math.min(index, 10) * 65 + 70}ms` }}
                >
                  <td data-label="Buyer / Invoice" className="cell-wrap">
                    <strong>{row.buyerName}</strong>
                    <br />
                    <span style={{ fontSize: "13px", color: "#6a84b0" }}>{row.invoiceNumber}</span>
                    <br />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#051c4a" }}>
                      {row.totalLabel}
                    </span>
                  </td>
                  <td data-label="Product / Courier" className="cell-wrap" style={{ color: "#4a6490", fontSize: "14px" }}>
                    {row.productName}
                    <br />
                    <span style={{ fontWeight: 600 }}>{row.expedition || "—"}</span>
                  </td>
                  <td data-label="Status">
                    <span
                      className={
                        row.status === "diproses"
                          ? "acct-count-badge acct-count-badge--warn"
                          : "acct-count-badge"
                      }
                      style={
                        row.status === "dikirim"
                          ? { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                          : undefined
                      }
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                  <td data-label="Tracking">
                    {row.canMarkShipped ? (
                      <input
                        type="text"
                        className="ship-tracking-input"
                        placeholder={
                          row.canAutoGenerateAwb
                            ? "Input tracking number"
                            : "Tracking / resi no."
                        }
                        value={trackingDraft[row.id_pengiriman] ?? ""}
                        disabled={processingKey !== null}
                        onChange={(e) =>
                          setTrackingDraft((prev) => ({
                            ...prev,
                            [row.id_pengiriman]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <span style={{ fontWeight: 600, color: "#051c4a", fontSize: "14px" }}>
                        {row.trackingNumber || "—"}
                      </span>
                    )}
                  </td>
                  <td className="admin-td-actions" data-label="Action">
                    {row.canMarkShipped ? (
                      <button
                        type="button"
                        className="acct-btn acct-btn--primary"
                        disabled={processingKey !== null}
                        onClick={() => handleShip(row)}
                      >
                        {processingKey === `ship-${row.id_pengiriman}`
                          ? row.canAutoGenerateAwb &&
                            !(trackingDraft[row.id_pengiriman] ?? "").trim()
                            ? "Creating…"
                            : "Shipping…"
                          : "Mark shipped"}
                      </button>
                    ) : (
                      <span style={{ fontSize: "13px", color: "#6a84b0" }}>Awaiting buyer confirmation</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
