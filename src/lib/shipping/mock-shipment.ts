import { mapExpeditionToBiteshipCourier } from "@/lib/biteship/courier-map";
import type { CreateBiteshipOrderResult } from "@/lib/biteship/create-order";
import type { TrackingResult } from "@/lib/biteship/tracking";

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
): Promise<CreateBiteshipOrderResult> {
  await mockDelay();

  const mapped = mapExpeditionToBiteshipCourier(input.expedition, input.courierType);
  const company = mapped?.company ?? "mock";
  const courierType = mapped?.type ?? "reg";
  const suffix = Date.now().toString(36).toUpperCase().slice(-8);
  const waybillId = `MOCK${input.idInvoice}${suffix}`.slice(0, 24);
  const biteshipOrderId = `mock-inv-${input.idInvoice}-${suffix}`;

  return {
    biteshipOrderId,
    waybillId,
    courierCompany: company,
    courierType,
    trackingUrl: null,
  };
}

export async function trackMockShipment(
  waybillId: string,
  courierCode: string
): Promise<TrackingResult> {
  await mockDelay(200);

  const now = new Date();
  const day = (offsetHours: number) =>
    new Date(now.getTime() - offsetHours * 60 * 60 * 1000).toISOString();

  return {
    status: "in_transit",
    message: "Mock tracking (development). Not connected to a live courier.",
    history: [
      {
        status: "delivered",
        note: "Estimated delivery (mock)",
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
