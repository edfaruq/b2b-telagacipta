/** Map display expedition names (penawaran.ekspedisi) to Biteship courier codes. */
const EXPEDITION_TO_BITESHIP: Array<{ match: RegExp; company: string; defaultType: string }> = [
  { match: /jne/i, company: "jne", defaultType: "reg" },
  { match: /j&t|jnt/i, company: "jnt", defaultType: "ez" },
  { match: /sicepat/i, company: "sicepat", defaultType: "reg" },
  { match: /anter/i, company: "anteraja", defaultType: "reg" },
  { match: /\bpos\b/i, company: "pos", defaultType: "reg" },
  { match: /tiki/i, company: "tiki", defaultType: "reg" },
  { match: /wahana/i, company: "wahana", defaultType: "reg" },
  { match: /ninja/i, company: "ninja", defaultType: "standard" },
  { match: /lion/i, company: "lion", defaultType: "regpack" },
  { match: /idexpress|id express/i, company: "idexpress", defaultType: "standard" },
  { match: /dhl/i, company: "dhl", defaultType: "express" },
  { match: /fedex/i, company: "fedex", defaultType: "priority" },
  { match: /\bups\b/i, company: "ups", defaultType: "saver" },
];

export function mapExpeditionToBiteshipCourier(
  expedition: string,
  courierTypeOverride?: string
): { company: string; type: string } | null {
  const trimmed = expedition.trim();
  if (!trimmed) return null;

  for (const row of EXPEDITION_TO_BITESHIP) {
    if (row.match.test(trimmed)) {
      return {
        company: row.company,
        type: (courierTypeOverride ?? row.defaultType).trim() || row.defaultType,
      };
    }
  }

  const slug = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (slug.length >= 2 && slug.length <= 20) {
    return {
      company: slug,
      type: (courierTypeOverride ?? "reg").trim() || "reg",
    };
  }

  return null;
}

export function extractPostalCodeFromAddress(address: string): number | null {
  const matches = address.match(/\b(\d{5})\b/g);
  if (!matches?.length) return null;
  const code = Number(matches[matches.length - 1]);
  return Number.isInteger(code) ? code : null;
}

export function normalizeIndonesiaPhone(raw: string | number): string {
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("62")) {
    digits = `0${digits.slice(2)}`;
  } else if (!digits.startsWith("0")) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 15);
}
