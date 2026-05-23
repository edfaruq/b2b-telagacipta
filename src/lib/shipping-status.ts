export const SHIPPING_STATUS = ["diproses", "dikirim", "diterima"] as const;
export type ShippingStatus = (typeof SHIPPING_STATUS)[number];

const LABELS: Record<ShippingStatus, string> = {
  diproses: "Processing",
  dikirim: "Shipped",
  diterima: "Delivered",
};

export function shippingStatusLabel(status: string): string {
  if (SHIPPING_STATUS.includes(status as ShippingStatus)) {
    return LABELS[status as ShippingStatus];
  }
  return status;
}
