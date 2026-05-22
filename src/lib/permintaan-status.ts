/** Status permintaan penawaran (tabel `permintaan`). */
export const PERMINTAAN_STATUS = ["menunggu", "diproses", "disetujui", "ditolak"] as const;
export type PermintaanStatus = (typeof PERMINTAAN_STATUS)[number];

export const PERMINTAAN_STATUS_DEFAULT: PermintaanStatus = "menunggu";

const STATUS_LABELS: Record<PermintaanStatus, string> = {
  menunggu: "Pending review",
  diproses: "Quotation received",
  disetujui: "Accepted",
  ditolak: "Rejected",
};

export function permintaanStatusLabel(status: string): string {
  if (PERMINTAAN_STATUS.includes(status as PermintaanStatus)) {
    return STATUS_LABELS[status as PermintaanStatus];
  }
  return status;
}

export function permintaanStatusStyle(status: string): {
  background: string;
  color: string;
  border: string;
} {
  switch (status) {
    case "disetujui":
      return { background: "#ecfdf3", color: "#166534", border: "1px solid #bbf7d0" };
    case "ditolak":
      return { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" };
    case "diproses":
      return { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
    default:
      return { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" };
  }
}
