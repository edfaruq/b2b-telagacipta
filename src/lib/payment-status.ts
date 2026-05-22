export const PAYMENT_STATUS = ["menunggu_validasi", "valid", "ditolak"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

const LABELS: Record<PaymentStatus, string> = {
  menunggu_validasi: "Awaiting validation",
  valid: "Validated",
  ditolak: "Not validated",
};

export function paymentStatusLabel(status: string): string {
  if (PAYMENT_STATUS.includes(status as PaymentStatus)) {
    return LABELS[status as PaymentStatus];
  }
  return status;
}

/** Shown to buyer when admin rejects payment proof. */
export function paymentRejectedMessage(adminNote?: string | null): string {
  const base =
    "Your payment was not validated. Please transfer the amount due again and upload a new payment proof.";
  const note = adminNote?.trim();
  if (!note) return base;
  return `${base} Admin note: ${note}`;
}
