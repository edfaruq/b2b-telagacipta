/** Mock shipping: auto-generate AWB when admin leaves tracking empty. */
export function canAutoCreateShipment(): boolean {
  return true;
}
