"use client";

import { useState } from "react";

type Props = {
  shipmentId: number;
};

export function ShippingLiveStatus({ shipmentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/shipping/track?id_pengiriman=${shipmentId}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as {
        tracking?: { status: string; message: string };
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "Could not load tracking.");
        setStatus(null);
        return;
      }
      const label = data.tracking?.status ?? "unknown";
      setStatus(label.replace(/_/g, " "));
    } catch {
      setError("Could not reach tracking service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        className="mq-ship-track-btn"
        disabled={loading}
        onClick={() => void load()}
      >
        {loading ? "Loading tracking…" : "Check live tracking"}
      </button>
      {status ? (
        <p className="mq-ship-line" style={{ marginTop: 6 }}>
          <strong>Carrier status:</strong> {status}
        </p>
      ) : null}
      {error ? (
        <p className="mq-ship-muted" style={{ marginTop: 4, color: "#b91c1c" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
