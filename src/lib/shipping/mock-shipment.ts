import { mapExpeditionToCourier } from "@/lib/shipping/courier-map";
import type { CreateMockShipmentResult, TrackingResult } from "@/lib/shipping/types";
import type { ShipmentTimingContext } from "@/lib/shipping/arrival-estimate";

export type CreateMockShipmentInput = {
  idInvoice: number;
  invoiceNumber: string;
  expedition: string;
  courierType?: string;
};

function mockDelay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createMockShipment(
  input: CreateMockShipmentInput
): Promise<CreateMockShipmentResult> {
  await mockDelay();

  const mapped = mapExpeditionToCourier(input.expedition, input.courierType);
  const company = mapped?.company ?? "mock";
  const courierType = mapped?.type ?? "reg";
  const suffix = Date.now().toString(36).toUpperCase().slice(-8);
  const waybillId = `MOCK${input.idInvoice}${suffix}`.slice(0, 24);

  return {
    waybillId,
    courierCompany: company,
    courierType,
  };
}

export async function trackMockShipment(
  waybillId: string,
  courierCode: string,
  timing?: ShipmentTimingContext
): Promise<TrackingResult> {
  await mockDelay(200);

  const now = new Date();
  const day = (offsetHours: number) =>
    new Date(now.getTime() - offsetHours * 60 * 60 * 1000).toISOString();

  const shipmentStatus = timing?.shipmentStatus ?? "dikirim";
  let status = "in_transit";
  let message = "Mock tracking (development). Not connected to a live courier.";

  if (shipmentStatus === "diterima") {
    status = "delivered";
    message = "Package delivered (mock).";
  } else if (shipmentStatus === "diproses") {
    status = "pending_pickup";
    message = "Awaiting pickup from warehouse (mock).";
  }

  const shipped =
    timing?.shippedAt instanceof Date
      ? timing.shippedAt
      : timing?.shippedAt
        ? new Date(timing.shippedAt)
        : null;
  const delivered =
    timing?.deliveredAt instanceof Date
      ? timing.deliveredAt
      : timing?.deliveredAt
        ? new Date(timing.deliveredAt)
        : null;

  const estimatedArrival =
    delivered && !Number.isNaN(delivered.getTime())
      ? delivered.toISOString()
      : shipped && !Number.isNaN(shipped.getTime())
        ? new Date(shipped.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    status,
    message,
    estimatedArrival,
    history: [
      {
        status: "delivered",
        note: "Delivered to recipient (mock)",
        updatedAt: day(-24),
      },
      {
        status: "in_transit",
        note: `In transit via ${courierCode.toUpperCase() || "courier"}`,
        updatedAt: day(-48),
      },
      {
        status: "picked_up",
        note: `Picked up — AWB ${waybillId}`,
        updatedAt: day(-72),
      },
    ],
  };
}
