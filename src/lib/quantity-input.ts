import { formatThousandsId, parseThousandsId } from "@/lib/number-input";

/** Parse quantity; clamp display + value to max stock while typing. */
export function parseQuantityInput(
  value: string,
  maxStock: number
): { input: string; quantity: number } | null {
  if (value === "") {
    return { input: "", quantity: 0 };
  }
  const parsed = Math.floor(parseThousandsId(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  const clamped = Math.min(parsed, maxStock);
  return { input: formatThousandsId(clamped), quantity: clamped };
}

export function normalizeQuantityOnBlur(
  input: string,
  maxStock: number
): { input: string; quantity: number } {
  if (input === "") {
    return { input: formatThousandsId(1), quantity: 1 };
  }
  const parsed = Math.floor(parseThousandsId(input));
  const normalized = !Number.isFinite(parsed)
    ? 1
    : Math.min(Math.max(parsed, 1), maxStock);
  return { input: formatThousandsId(normalized), quantity: normalized };
}
