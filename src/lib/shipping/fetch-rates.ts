import {
  buildRateItemsFromOrder,
  fetchBiteshipRates,
  type FetchRatesInput,
  type NormalizedRate,
} from "@/lib/biteship/rates";
import { calculateMockShippingRates } from "@/lib/shipping/mock-rates";
import { isMockShippingEnabled } from "@/lib/shipping/shipping-provider";

export type FetchShippingRatesInput = FetchRatesInput & {
  destinationCountry: string;
  quantity: number;
};

export async function fetchShippingRates(input: FetchShippingRatesInput): Promise<NormalizedRate[]> {
  if (isMockShippingEnabled()) {
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

  return fetchBiteshipRates(input);
}

export { buildRateItemsFromOrder };
