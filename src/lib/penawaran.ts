import { formatPriceIdr } from "@/lib/catalog-product";

export const PENAWARAN_STATUS = ["draft", "dikirim", "disetujui", "ditolak"] as const;
export type PenawaranStatus = (typeof PENAWARAN_STATUS)[number];

const PENAWARAN_LABELS: Record<PenawaranStatus, string> = {
  draft: "Draft",
  dikirim: "Sent",
  disetujui: "Accepted",
  ditolak: "Rejected",
};

export function penawaranStatusLabel(status: string): string {
  if (PENAWARAN_STATUS.includes(status as PenawaranStatus)) {
    return PENAWARAN_LABELS[status as PenawaranStatus];
  }
  return status;
}

/** Subtotal = unit price × quantity + shipping (stored in `total_penawaran`). */
export function computeTotalPenawaran(
  hargaPerUnit: number,
  quantity: number,
  biayaPengiriman: number
): number {
  const unit = Number.isFinite(hargaPerUnit) ? hargaPerUnit : 0;
  const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
  const ship = Number.isFinite(biayaPengiriman) ? biayaPengiriman : 0;
  return Math.round((unit * qty + ship) * 100) / 100;
}

export function formatPenawaranFields(
  hargaPerUnit: number,
  quantity: number,
  biayaPengiriman: number,
  total: number,
  satuan: string
) {
  const unit = (satuan || "kg").trim();
  return {
    hargaPerUnitLabel: `${formatPriceIdr(hargaPerUnit)} /${unit}`,
    biayaPengirimanLabel: formatPriceIdr(biayaPengiriman),
    subtotalLabel: formatPriceIdr(hargaPerUnit * quantity),
    totalPenawaranLabel: formatPriceIdr(total),
  };
}
