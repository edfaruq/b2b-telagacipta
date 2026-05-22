export const INVOICE_STATUS = ["belum_bayar", "lunas", "dibatalkan"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

const LABELS: Record<InvoiceStatus, string> = {
  belum_bayar: "Unpaid",
  lunas: "Paid",
  dibatalkan: "Cancelled",
};

export function invoiceStatusLabel(status: string): string {
  if (INVOICE_STATUS.includes(status as InvoiceStatus)) {
    return LABELS[status as InvoiceStatus];
  }
  return status;
}

export function invoiceStatusStyle(status: string): {
  background: string;
  color: string;
  border: string;
} {
  switch (status) {
    case "lunas":
      return { background: "#ecfdf3", color: "#166534", border: "1px solid #bbf7d0" };
    case "dibatalkan":
      return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" };
    default:
      return { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" };
  }
}
