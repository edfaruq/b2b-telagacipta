export const MIN_ORDER_RATING = 1;
export const MAX_ORDER_RATING = 5;
export const MAX_ORDER_FEEDBACK_LENGTH = 2000;

export function parseOrderRating(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_ORDER_RATING || n > MAX_ORDER_RATING) {
    return null;
  }
  return n;
}

export function normalizeOrderFeedback(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
