import type { RateItem } from "@/lib/shipping/types";

const DEFAULT_ITEM_WEIGHT_GRAMS = 1000;

export function buildRateItemsFromOrder(params: {
  productName: string;
  quantity: number;
  valueIdr: number;
  weightGrams?: number;
}): RateItem[] {
  const qty = Math.max(1, Math.round(params.quantity) || 1);
  const weightPerUnit = params.weightGrams ?? DEFAULT_ITEM_WEIGHT_GRAMS;

  return [
    {
      name: params.productName.slice(0, 120) || "B2B order",
      description: params.productName.slice(0, 200),
      value: Math.max(1000, Math.round(params.valueIdr)),
      quantity: qty,
      weight: Math.max(100, Math.round(weightPerUnit * qty)),
      category: "others",
    },
  ];
}
