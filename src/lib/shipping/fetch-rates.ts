import { calculateMockShippingRates } from "@/lib/shipping/mock-rates";
import { buildRateItemsFromOrder } from "@/lib/shipping/rate-items";
import type { NormalizedRate, RateItem } from "@/lib/shipping/types";

export type FetchShippingRatesInput = {
  destinationAddress: string;
  destinationCountry: string;
  quantity: number;
  expedition?: string;
  items: RateItem[];
};

export async function fetchShippingRates(input: FetchShippingRatesInput): Promise<NormalizedRate[]> {
  const items = input.items;
  const item = items[0];
  const qty = Math.max(1, Math.round(input.quantity) || item?.quantity || 1);
  const weightKg = Math.max(0.5, (item?.weight ?? 1000) / 1000);

  return calculateMockShippingRates({
    destinationCountry: input.destinationCountry,
    destinationAddress: input.destinationAddress,
    weightKg,
    quantity: qty,
    expedition: input.expedition,
  });
}

export { buildRateItemsFromOrder };
