import { biteshipRequest } from "@/lib/biteship/client";
import { getBiteshipConfig } from "@/lib/biteship/config";
import {
  extractPostalCodeFromAddress,
  mapExpeditionToBiteshipCourier,
} from "@/lib/biteship/courier-map";
import type { BiteshipRateItem, BiteshipRatesResponse } from "@/lib/biteship/types";

export type FetchRatesInput = {
  destinationAddress: string;
  destinationPostalCode?: number | null;
  couriers?: string;
  expedition?: string;
  items: BiteshipRateItem[];
};

export type NormalizedRate = {
  company: string;
  courierName: string;
  serviceName: string;
  serviceType: string;
  price: number;
  shippingFee: number;
  duration: string;
  description: string;
};

export async function fetchBiteshipRates(input: FetchRatesInput): Promise<NormalizedRate[]> {
  const config = getBiteshipConfig();
  const destinationPostal =
    input.destinationPostalCode ??
    extractPostalCodeFromAddress(input.destinationAddress) ??
    config.defaultDestinationPostalCode;

  let couriers = input.couriers ?? config.defaultCouriers;
  if (input.expedition) {
    const mapped = mapExpeditionToBiteshipCourier(input.expedition);
    if (mapped) {
      couriers = mapped.company;
    }
  }

  const data = await biteshipRequest<BiteshipRatesResponse>("/v1/rates/couriers", {
    body: {
      origin_postal_code: config.origin.postalCode,
      destination_postal_code: destinationPostal,
      couriers,
      items: input.items.map((item) => ({
        name: item.name,
        description: item.description ?? item.name,
        category: item.category ?? "others",
        value: item.value,
        quantity: item.quantity,
        weight: item.weight,
        height: 10,
        length: 10,
        width: 10,
      })),
    },
  });

  return (data.pricing ?? []).map((row) => ({
    company: row.courier_code || row.company,
    courierName: row.courier_name,
    serviceName: row.courier_service_name,
    serviceType: row.type || row.courier_service_code,
    price: row.price,
    shippingFee: row.shipping_fee,
    duration: row.duration ?? "",
    description: row.description ?? "",
  }));
}

export function buildRateItemsFromOrder(params: {
  productName: string;
  quantity: number;
  valueIdr: number;
  weightGrams?: number;
}): BiteshipRateItem[] {
  const config = getBiteshipConfig();
  const qty = Math.max(1, Math.round(params.quantity) || 1);
  const weightPerUnit = params.weightGrams ?? config.defaultItemWeightGrams;

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
