"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  PendingQuotationsPanel,
  type PendingQuotationRow,
} from "@/components/admin/PendingQuotationsPanel";
import { PendingPaymentsPanel } from "@/components/admin/PendingPaymentsPanel";
import { OrderHistoryPanel } from "@/components/admin/OrderHistoryPanel";
import { PendingShipmentsPanel } from "@/components/admin/PendingShipmentsPanel";

export type OrderTab = "quotations" | "payments" | "shipping" | "history";

const IconQuotation = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconPayment = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path
      d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconTruck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path
      d="M1 3h13v11H1V3zm13 4h4l3 3v4h-7V7zM5 19a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconHistory = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path
      d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const tabs: { key: OrderTab; label: string; icon: ReactNode }[] = [
  { key: "quotations", label: "Quotation requests", icon: <IconQuotation /> },
  { key: "payments", label: "Payment validation", icon: <IconPayment /> },
  { key: "shipping", label: "Shipping", icon: <IconTruck /> },
  { key: "history", label: "Order history", icon: <IconHistory /> },
];

export function ManageOrdersPanel() {
  const [activeTab, setActiveTab] = useState<OrderTab>("quotations");
  const [quotations, setPendingQuotations] = useState<PendingQuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("error");
  const [badges, setBadges] = useState({
    quotations: 0,
    payments: 0,
    shipments: 0,
  });

  const loadBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/nav-badges", { cache: "no-store" });
      const data = (await res.json()) as {
        pendingQuotationRequests?: number;
        pendingPayments?: number;
        pendingShipments?: number;
      };
      if (res.ok) {
        setBadges({
          quotations: Number(data.pendingQuotationRequests) || 0,
          payments: Number(data.pendingPayments) || 0,
          shipments: Number(data.pendingShipments) || 0,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchQuotationsData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/quotations", { cache: "no-store" });
      const data = (await res.json()) as {
        quotations?: PendingQuotationRow[];
        message?: string;
      };
      if (!res.ok) {
        setMessage(data.message ?? "Failed to load quotation requests.");
        setMessageTone("error");
        setPendingQuotations([]);
        return;
      }
      setPendingQuotations(data.quotations ?? []);
      if (isManual) setMessage("");
    } catch {
      setMessage("Unable to connect to the server.");
      setMessageTone("error");
      setPendingQuotations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "quotations") {
      setMessage("");
      fetchQuotationsData();
    }
  }, [activeTab, fetchQuotationsData]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const refreshBadges = useCallback(async () => {
    await loadBadges();
    window.dispatchEvent(new Event("admin-nav-badges-refresh"));
  }, [loadBadges]);

  const handleSendQuotationDone = async () => {
    setMessage("Quotation sent to customer successfully.");
    setMessageTone("success");
    await fetchQuotationsData(true);
    await refreshBadges();
  };

  const badgeForTab = (key: OrderTab) => {
    if (key === "quotations") return badges.quotations;
    if (key === "payments") return badges.payments;
    if (key === "shipping") return badges.shipments;
    return 0;
  };

  return (
    <div className="mo-wrap">
      <style>{`
        @keyframes moPageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mo-wrap { animation: moPageIn 0.4s ease-out both; }
        .mo-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0 0 20px;
        }
        .mo-tab-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
        }
        .mo-tab {
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
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .mo-tab:hover {
          background: #f7faff;
          border-color: #0b47b8;
          color: #0b47b8;
        }
        .mo-tab.is-active {
          background: #0b47b8;
          border-color: #0b47b8;
          color: #fff;
        }
        .mo-tab-badge {
          min-width: 20px;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          text-align: center;
        }
        .mo-tab:not(.is-active) .mo-tab-badge {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .mo-tab.is-active .mo-tab-badge {
          background: rgba(255, 255, 255, 0.22);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.35);
        }
        .mo-tab-badge--empty { display: none; }
      `}</style>

      <header>
        <h1 style={{ margin: "0 0 4px", fontSize: "32px", color: "#051c4a" }}>Manage Orders</h1>
        <p style={{ margin: "7px 0 18px", color: "#6a84b0", fontSize: "17px" }}>
          Quotations, payments, shipping, and completed order history.
        </p>
      </header>

      <div className="mo-tabs" role="tablist" aria-label="Order management">
        {tabs.map((tab) => {
          const count = badgeForTab(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`mo-tab${activeTab === tab.key ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="mo-tab-icon">{tab.icon}</span>
              {tab.label}
              <span
                className={`mo-tab-badge${count === 0 ? " mo-tab-badge--empty" : ""}`}
                aria-hidden={count === 0}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === "quotations" ? (
          <PendingQuotationsPanel
            embedded
            quotations={quotations}
            loading={loading}
            refreshing={refreshing}
            processingKey={processingKey}
            message={message}
            messageTone={messageTone}
            onRefresh={() => fetchQuotationsData(true)}
            onSendQuotation={handleSendQuotationDone}
          />
        ) : null}
        {activeTab === "payments" ? (
          <PendingPaymentsPanel embedded onActivity={refreshBadges} />
        ) : null}
        {activeTab === "shipping" ? (
          <PendingShipmentsPanel embedded onActivity={refreshBadges} />
        ) : null}
        {activeTab === "history" ? <OrderHistoryPanel embedded /> : null}
      </div>
    </div>
  );
}
