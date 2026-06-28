/** Format angka bulat dengan pemisah ribuan titik (format Indonesia: 1.000.000). */
export function formatThousandsId(value: number): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

/**
 * Parse input berformat Indonesia: "1.000.000", "13.500,50", atau "1000".
 */
export function parseThousandsId(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return NaN;

  const commaIdx = trimmed.lastIndexOf(",");
  if (commaIdx >= 0) {
    const intPart = trimmed.slice(0, commaIdx).replace(/\./g, "").replace(/\D/g, "");
    const decPart = trimmed.slice(commaIdx + 1).replace(/\D/g, "");
    if (!intPart && !decPart) return NaN;
    const n = Number.parseFloat(`${intPart || "0"}.${decPart || "0"}`);
    return Number.isFinite(n) ? n : NaN;
  }

  const digits = trimmed.replace(/\./g, "").replace(/\D/g, "");
  if (!digits) return NaN;
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) ? n : NaN;
}

/** Format saat mengetik — hanya digit bulat + titik ribuan. */
export function formatThousandsOnInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  const n = Number.parseInt(digits, 10);
  if (Number.isNaN(n)) return "";
  return formatThousandsId(n);
}

/** Format harga saat mengetik — titik ribuan, koma opsional untuk desimal. */
export function formatAmountOnInput(raw: string): string {
  let cleaned = raw.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  if (parts.length > 2) {
    cleaned = parts[0] + "," + parts.slice(1).join("");
  }

  const hasTrailingComma = cleaned.endsWith(",");
  const [intPart = "", decPart] = cleaned.split(",");
  const intDigits = intPart.replace(/\D/g, "");

  let result = "";
  if (intDigits) {
    const n = Number.parseInt(intDigits, 10);
    if (!Number.isNaN(n)) result = formatThousandsId(n);
  }

  if (decPart !== undefined) {
    result = `${result},${decPart.replace(/\D/g, "").slice(0, 2)}`;
  } else if (hasTrailingComma && intDigits) {
    result = `${result},`;
  }

  return result;
}

/** Nilai awal dari number ke string tampilan. */
export function formatNumberFieldValue(
  value: number | string | null | undefined,
  mode: "integer" | "amount" = "integer"
): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : parseThousandsId(String(value));
  if (!Number.isFinite(n)) return "";
  if (mode === "amount" && !Number.isInteger(n)) {
    const [intPart, decPart] = n.toFixed(2).split(".");
    const dec = decPart?.replace(/0+$/, "") ?? "";
    return dec ? `${formatThousandsId(Number(intPart))},${dec}` : formatThousandsId(n);
  }
  return formatThousandsId(Math.round(n));
}
