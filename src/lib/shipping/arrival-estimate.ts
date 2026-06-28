const DISPLAY_LOCALE = "en-GB";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(DISPLAY_LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Exported for live tracking UI — same locale as arrival labels. */
export function formatShipmentDisplayDate(date: Date): string {
  return formatDisplayDate(date);
}

function addBusinessDays(start: Date, businessDays: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      added += 1;
    }
  }
  return d;
}

export function formatCarrierStatus(status: string): string {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");
  const labels: Record<string, string> = {
    delivered: "Delivered",
    in_transit: "In transit",
    pending_pickup: "Awaiting pickup",
    picked_up: "Picked up",
    unknown: "Unknown",
  };
  return labels[normalized] ?? status.replace(/_/g, " ");
}

/** Human-readable arrival line for buyer shipping card. */
export function getArrivalEstimationLabel(input: {
  shipmentStatus: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}): string {
  const delivered = parseDate(input.deliveredAt);
  if (input.shipmentStatus === "diterima") {
    return delivered
      ? `Delivered on ${formatDisplayDate(delivered)}`
      : "Delivered";
  }

  const shipped = parseDate(input.shippedAt);
  if (input.shipmentStatus === "dikirim") {
    if (shipped) {
      const estimate = addBusinessDays(shipped, 5);
      return `Estimated arrival ${formatDisplayDate(estimate)}`;
    }
    return "Estimated 3–7 business days after dispatch";
  }

  return "Available after the order is shipped";
}

/** Prefer DB shipment state over stale mock/API carrier status. */
export function resolveCarrierStatus(
  apiStatus: string,
  shipmentStatus: string
): string {
  if (shipmentStatus === "diterima") {
    return "delivered";
  }
  if (shipmentStatus === "diproses") {
    return "pending_pickup";
  }
  const api = apiStatus.trim().toLowerCase();
  if (!api || api === "unknown") {
    return "in_transit";
  }
  return api;
}

export type ShipmentTimingContext = {
  shipmentStatus: string;
  shippedAt: Date | string | null;
  deliveredAt: Date | string | null;
};

export function toShipmentTimingContext(row: {
  status_pengiriman: string;
  tanggal_pengiriman: Date | string | null;
  tanggal_diterima: Date | string | null;
}): ShipmentTimingContext {
  return {
    shipmentStatus: row.status_pengiriman,
    shippedAt: row.tanggal_pengiriman,
    deliveredAt: row.tanggal_diterima,
  };
}
