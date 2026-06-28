/** Bank transfer accounts shown on Pay Invoice. */
export type PaymentBankAccount = {
  id: "bca" | "bri";
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  logoSrc: string;
};

export const PAYMENT_BANKS: PaymentBankAccount[] = [
  {
    id: "bca",
    bankName: "Bank BCA",
    accountNumber: "7401986972",
    accountHolder: "PT Telagacipta Indonesia",
    logoSrc: "/images/logo-bca.png",
  },
  {
    id: "bri",
    bankName: "Bank BRI",
    accountNumber: "123401000123537",
    accountHolder: "PT Telagacipta Indonesia",
    logoSrc: "/images/logo-bri.png",
  },
];

/** @deprecated Use PAYMENT_BANKS — kept for imports that expect a single primary bank. */
export const PAYMENT_BANK = PAYMENT_BANKS[0];

export function paymentBanksSummaryLine(): string {
  return PAYMENT_BANKS.map((b) => `${b.bankName}: ${b.accountNumber}`).join(" · ");
}
