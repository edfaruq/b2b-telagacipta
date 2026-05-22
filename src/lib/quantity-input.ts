/** Parse digit-only quantity; clamp display + value to max stock while typing. */
export function parseQuantityInput(
  value: string,
  maxStock: number
): { input: string; quantity: number } | null {
  if (value === "") {
    return { input: "", quantity: 0 };
  }
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  const clamped = Math.min(parsed, maxStock);
  return { input: String(clamped), quantity: clamped };
}

export function normalizeQuantityOnBlur(
  input: string,
  maxStock: number
): { input: string; quantity: number } {
  if (input === "") {
    return { input: "1", quantity: 1 };
  }
  const parsed = Number.parseInt(input, 10);
  const normalized = Number.isNaN(parsed)
    ? 1
    : Math.min(Math.max(parsed, 1), maxStock);
  return { input: String(normalized), quantity: normalized };
}
