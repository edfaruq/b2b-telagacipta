import { PAYMENT_BANKS, paymentBanksSummaryLine } from "@/lib/payment-bank";

export type PaymentMethodCode = "transfer" | "paypal";

/** Human-readable payment method for invoice / receipt. */
export function paymentMethodLabel(metode: string | null | undefined): string {
  if (metode === "paypal") {
    return "PayPal";
  }
  const names = PAYMENT_BANKS.map((b) => b.bankName.replace(/^Bank /, "")).join(" / ");
  return `Bank transfer — ${names}`;
}

/** Extra line for receipt (bank accounts); empty for PayPal. */
export function paymentMethodDetail(metode: string | null | undefined): string | null {
  if (metode === "paypal") {
    return null;
  }
  return paymentBanksSummaryLine();
}
