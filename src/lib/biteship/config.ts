export type BiteshipConfig = {
  apiKey: string;
  baseUrl: string;
  origin: {
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    postalCode: number;
  };
  defaultDestinationPostalCode: number;
  defaultItemWeightGrams: number;
  defaultCouriers: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePostalCode(raw: string | undefined, fallback: number): number {
  const n = Number(String(raw ?? "").replace(/\D/g, ""));
  if (Number.isInteger(n) && n >= 10000 && n <= 99999) {
    return n;
  }
  return fallback;
}

export function getBiteshipConfig(): BiteshipConfig {
  const apiKey = requireEnv("BITESHIP_API_KEY");
  const baseUrl = (process.env.BITESHIP_API_BASE_URL ?? "https://api.biteship.com").replace(
    /\/$/,
    ""
  );

  const defaultPostal = 12950;

  return {
    apiKey,
    baseUrl,
    origin: {
      contactName: process.env.BITESHIP_ORIGIN_CONTACT_NAME?.trim() || "PT Telaga Cipta Indonesia",
      contactPhone: process.env.BITESHIP_ORIGIN_CONTACT_PHONE?.trim() || "02112345678",
      contactEmail:
        process.env.BITESHIP_ORIGIN_CONTACT_EMAIL?.trim() || "export@telagacipta.com",
      address:
        process.env.BITESHIP_ORIGIN_ADDRESS?.trim() ||
        "Graha Surveyor Indonesia, Jl. Gatot Subroto No.Kav. 56, Jakarta Selatan, DKI Jakarta 12950",
      postalCode: parsePostalCode(process.env.BITESHIP_ORIGIN_POSTAL_CODE, defaultPostal),
    },
    defaultDestinationPostalCode: parsePostalCode(
      process.env.BITESHIP_DEFAULT_DESTINATION_POSTAL_CODE,
      defaultPostal
    ),
    defaultItemWeightGrams: Math.max(
      100,
      Number(process.env.BITESHIP_DEFAULT_ITEM_WEIGHT_GRAMS) || 1000
    ),
    defaultCouriers:
      process.env.BITESHIP_DEFAULT_COURIERS?.trim() ||
      "jne,sicepat,anteraja,jnt,pos,tiki,wahana",
  };
}

export function isBiteshipConfigured(): boolean {
  try {
    getBiteshipConfig();
    return Boolean(process.env.BITESHIP_API_KEY?.trim());
  } catch {
    return false;
  }
}
