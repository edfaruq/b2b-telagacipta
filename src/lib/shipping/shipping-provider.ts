/**
 * Shipping provider switch.
 * - mock (default): no Biteship API calls; mock rates / AWB / tracking.
 * - biteship: live Biteship API (requires BITESHIP_API_KEY).
 */
export function isMockShippingEnabled(): boolean {
  const provider = process.env.SHIPPING_PROVIDER?.trim().toLowerCase();
  return provider !== "biteship";
}

export function isLiveBiteshipEnabled(): boolean {
  if (isMockShippingEnabled()) return false;
  return Boolean(process.env.BITESHIP_API_KEY?.trim());
}

/** Auto-create AWB when admin leaves tracking empty. */
export function canAutoCreateShipment(): boolean {
  return isMockShippingEnabled() || isLiveBiteshipEnabled();
}
