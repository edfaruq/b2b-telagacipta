import type { NormalizedRate } from "@/lib/shipping/types";

export type MockShippingRateInput = {
  destinationCountry: string;
  destinationAddress?: string;
  weightKg: number;
  quantity: number;
  expedition?: string;
};

type MockCourierTemplate = {
  company: string;
  courierName: string;
  serviceName: string;
  serviceType: string;
  baseMin: number;
  baseMax: number;
  perKg: number;
  duration: string;
  international: boolean;
};

const DOMESTIC_MOCK_COURIERS: MockCourierTemplate[] = [
  {
    company: "jne",
    courierName: "JNE",
    serviceName: "REG",
    serviceType: "reg",
    baseMin: 18_000,
    baseMax: 22_000,
    perKg: 4_500,
    duration: "2–4 days",
    international: false,
  },
  {
    company: "jnt",
    courierName: "J&T",
    serviceName: "EZ",
    serviceType: "ez",
    baseMin: 19_000,
    baseMax: 24_000,
    perKg: 4_200,
    duration: "2–3 days",
    international: false,
  },
  {
    company: "sicepat",
    courierName: "SiCepat",
    serviceName: "REG",
    serviceType: "reg",
    baseMin: 20_000,
    baseMax: 26_000,
    perKg: 4_000,
    duration: "2–4 days",
    international: false,
  },
  {
    company: "anteraja",
    courierName: "AnterAja",
    serviceName: "REG",
    serviceType: "reg",
    baseMin: 18_500,
    baseMax: 23_500,
    perKg: 4_300,
    duration: "2–5 days",
    international: false,
  },
];

const INTERNATIONAL_MOCK_COURIERS: MockCourierTemplate[] = [
  {
    company: "dhl",
    courierName: "DHL",
    serviceName: "Express",
    serviceType: "express",
    baseMin: 350_000,
    baseMax: 480_000,
    perKg: 85_000,
    duration: "3–5 business days",
    international: true,
  },
  {
    company: "fedex",
    courierName: "FedEx",
    serviceName: "International Priority",
    serviceType: "priority",
    baseMin: 420_000,
    baseMax: 580_000,
    perKg: 92_000,
    duration: "3–6 business days",
    international: true,
  },
  {
    company: "ups",
    courierName: "UPS",
    serviceName: "Worldwide Saver",
    serviceType: "saver",
    baseMin: 380_000,
    baseMax: 700_000,
    perKg: 88_000,
    duration: "4–7 business days",
    international: true,
  },
];

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function isIndonesiaDestination(country: string, address?: string): boolean {
  const c = country.trim().toLowerCase();
  if (c === "indonesia" || c === "id" || c === "indo") return true;
  if (!c && address) {
    return /\bindonesia\b/i.test(address);
  }
  return false;
}

function mockPrice(template: MockCourierTemplate, totalWeightKg: number, seed: string): number {
  const spread = template.baseMax - template.baseMin;
  const base = template.baseMin + (hashSeed(seed) % (spread + 1));
  const extraKg = Math.max(0, totalWeightKg - 1);
  return Math.round(base + extraKg * template.perKg);
}

function expeditionMatches(template: MockCourierTemplate, expedition: string): boolean {
  const e = expedition.trim().toLowerCase();
  if (!e) return true;
  const hay = `${template.courierName} ${template.company} ${template.serviceName}`.toLowerCase();
  const first = e.split(/\s+/)[0] ?? e;
  return hay.includes(first) || e.includes(template.company) || e.includes(template.courierName.toLowerCase());
}

function toNormalizedRate(template: MockCourierTemplate, price: number): NormalizedRate {
  return {
    company: template.company,
    courierName: template.courierName,
    serviceName: template.serviceName,
    serviceType: template.serviceType,
    price,
    shippingFee: price,
    duration: template.duration,
    description: template.international ? "International mock rate" : "Domestic mock rate",
  };
}

/**
 * Development mock shipping rates (no external API).
 */
export async function calculateMockShippingRates(
  input: MockShippingRateInput
): Promise<NormalizedRate[]> {
  await new Promise((resolve) => setTimeout(resolve, 320));

  const qty = Math.max(1, Math.round(input.quantity) || 1);
  const totalWeightKg = Math.max(0.5, input.weightKg);

  const domestic = isIndonesiaDestination(input.destinationCountry, input.destinationAddress);
  const templates = domestic ? DOMESTIC_MOCK_COURIERS : INTERNATIONAL_MOCK_COURIERS;

  const seedBase = `${input.destinationCountry}|${qty}|${totalWeightKg.toFixed(2)}`;
  let rates = templates.map((t) =>
    toNormalizedRate(t, mockPrice(t, totalWeightKg, `${seedBase}|${t.company}|${t.serviceType}`))
  );

  if (input.expedition?.trim()) {
    const matched = templates
      .filter((t) => expeditionMatches(t, input.expedition!))
      .map((t) =>
        toNormalizedRate(t, mockPrice(t, totalWeightKg, `${seedBase}|${t.company}|${t.serviceType}`))
      );
    if (matched.length > 0) {
      rates = matched;
    }
  }

  return rates.sort((a, b) => a.price - b.price);
}
