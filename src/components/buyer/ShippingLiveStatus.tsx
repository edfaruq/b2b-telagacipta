"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatCarrierStatus,
  formatShipmentDisplayDate,
  getArrivalEstimationLabel,
  resolveCarrierStatus,
} from "@/lib/shipping/arrival-estimate";

type Props = {
  shipmentId: number;
  trackingNumber: string;
  shipmentStatus: string;
  shippedAt: string | null;
  deliveredAt: string | null;
};

export function ShippingLiveStatus({
  shipmentId,
  trackingNumber,
  shipmentStatus,
  shippedAt,
  deliveredAt,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [arrivalLabel, setArrivalLabel] = useState(() =>
    getArrivalEstimationLabel({ shipmentStatus, shippedAt, deliveredAt })
  );

  const initialCarrierStatus = useMemo(
    () => formatCarrierStatus(resolveCarrierStatus("", shipmentStatus)),
    [shipmentStatus]
  );

  useEffect(() => {
    setArrivalLabel(getArrivalEstimationLabel({ shipmentStatus, shippedAt, deliveredAt }));
    setStatus(
      shipmentStatus === "diterima" || shipmentStatus === "diproses"
        ? initialCarrierStatus
        : null
    );
  }, [shipmentStatus, shippedAt, deliveredAt, initialCarrierStatus]);

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/shipping/track?id_pengiriman=${shipmentId}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as {
        tracking?: {
          status: string;
          message: string;
          estimatedArrival?: string | null;
        };
        message?: string;
      };
      if (!res.ok) {
        setError(data.message ?? "Could not load tracking.");
        return;
      }
      const raw = data.tracking?.status ?? "unknown";
      const resolved = resolveCarrierStatus(raw, shipmentStatus);
      setStatus(formatCarrierStatus(resolved));

      if (data.tracking?.estimatedArrival) {
        const est = new Date(data.tracking.estimatedArrival);
        if (!Number.isNaN(est.getTime())) {
          if (shipmentStatus === "diterima") {
            setArrivalLabel(
              getArrivalEstimationLabel({ shipmentStatus, shippedAt, deliveredAt })
            );
          } else {
            setArrivalLabel(`Estimated arrival ${formatShipmentDisplayDate(est)}`);
          }
        }
      }
    } catch {
      setError("Could not reach tracking service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mq-ship-tracking-block">
      <div className="mq-ship-line mq-ship-line--track">
        <strong>Tracking number:</strong>
        <span className="mq-track-number">{trackingNumber}</span>
        <button
          type="button"
          className="mq-copy-track-btn"
          onClick={() => void handleCopyTracking()}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mq-ship-line">
        <strong>Arrival estimation:</strong> {arrivalLabel}
      </p>
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
