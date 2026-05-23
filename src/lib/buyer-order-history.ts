/** Order appears in buyer "Order history" after delivery + rating submitted. */
export function isBuyerOrderInHistory(item: {
  invoice?: {
    shipping?: { status: string; rating: number | null } | null;
  } | null;
}): boolean {
  const shipping = item.invoice?.shipping;
  if (!shipping || shipping.status !== "diterima") return false;
  return shipping.rating != null && shipping.rating >= 1;
}
