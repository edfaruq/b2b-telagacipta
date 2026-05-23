import { biteshipRequest } from "@/lib/biteship/client";
import type { BiteshipTrackingResponse } from "@/lib/biteship/types";

export type TrackingResult = {
  status: string;
  message: string;
  history: Array<{ status: string; note: string; updatedAt: string }>;
};

/** Public tracking by waybill + courier code (Biteship docs). */
export async function trackByWaybill(
  waybillId: string,
  courierCode: string
): Promise<TrackingResult> {
  const waybill = waybillId.trim();
  const courier = courierCode.trim().toLowerCase();
  if (!waybill || !courier) {
    throw new Error("Waybill and courier code are required.");
  }

  const data = await biteshipRequest<BiteshipTrackingResponse>(
    `/v1/trackings/${encodeURIComponent(waybill)}/couriers/${encodeURIComponent(courier)}`
  );

  return {
    status: data.status ?? "unknown",
    message: data.message ?? "",
    history: (data.history ?? []).map((h) => ({
      status: h.status ?? "",
      note: h.note ?? "",
      updatedAt: h.updated_at ?? "",
    })),
  };
}

/** Tracking by Biteship order id (orders created via API). */
export async function trackByOrderId(biteshipOrderId: string): Promise<TrackingResult> {
  const id = biteshipOrderId.trim();
  if (!id) {
    throw new Error("Biteship order id is required.");
  }

  const data = await biteshipRequest<BiteshipTrackingResponse>(
    `/v1/trackings/${encodeURIComponent(id)}`
  );

  return {
    status: data.status ?? "unknown",
    message: data.message ?? "",
    history: (data.history ?? []).map((h) => ({
      status: h.status ?? "",
      note: h.note ?? "",
      updatedAt: h.updated_at ?? "",
    })),
  };
}
