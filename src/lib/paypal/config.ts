/** PayPal REST API — sandbox only for this project phase. */

export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  baseUrl: "https://api-m.sandbox.paypal.com";
};

export type PayPalCurrency = "USD" | "IDR";

const SUPPORTED: PayPalCurrency[] = ["USD", "IDR"];

export function getPayPalConfig(): PayPalConfig {
  const mode = (process.env.PAYPAL_MODE ?? "").trim().toLowerCase();
  if (mode !== "sandbox") {
    throw new Error("PayPal is restricted to sandbox mode (PAYPAL_MODE=sandbox).");
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal is not configured. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET."
    );
  }

  return {
    clientId,
    clientSecret,
    baseUrl: "https://api-m.sandbox.paypal.com",
  };
}

export function isPayPalConfigured(): boolean {
  try {
    getPayPalConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Checkout currency. Default USD — most PayPal Sandbox business accounts do not accept IDR.
 * Set PAYPAL_CURRENCY=IDR only if your PayPal merchant account supports it.
 */
export function getPayPalCurrency(): PayPalCurrency {
  const raw = (
    process.env.PAYPAL_CURRENCY ??
    process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ??
    "USD"
  )
    .trim()
    .toUpperCase();

  if (!SUPPORTED.includes(raw as PayPalCurrency)) {
    throw new Error(`PAYPAL_CURRENCY must be one of: ${SUPPORTED.join(", ")}`);
  }
  return raw as PayPalCurrency;
}

/** Public copy for PayPal JS SDK (must match server PAYPAL_CURRENCY). */
export function getPayPalCurrencyPublic(): PayPalCurrency {
  const raw = (process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ?? process.env.PAYPAL_CURRENCY ?? "USD")
    .trim()
    .toUpperCase();
  if (raw === "IDR" || raw === "USD") return raw;
  return "USD";
}

/** How many IDR equal 1 USD (sandbox conversion). Example: 16000 → Rp 8.000.000 ≈ $500. */
function getIdrPerUsd(): number {
  const n = Number(process.env.PAYPAL_IDR_PER_USD ?? "16000");
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("PAYPAL_IDR_PER_USD must be a positive number.");
  }
  return n;
}

export type PayPalMoney = {
  currency_code: PayPalCurrency;
  value: string;
};

/** Map invoice total (IDR in DB) to PayPal order amount. */
export function invoiceTotalToPayPalAmount(totalIdr: number): PayPalMoney {
  const rounded = Math.round(totalIdr);
  if (!Number.isFinite(rounded) || rounded <= 0) {
    throw new Error("Invalid invoice amount for PayPal.");
  }

  const currency = getPayPalCurrency();

  if (currency === "IDR") {
    return { currency_code: "IDR", value: String(rounded) };
  }

  const usd = rounded / getIdrPerUsd();
  if (usd < 0.01) {
    throw new Error("Invoice amount is too small for USD PayPal checkout.");
  }

  return { currency_code: "USD", value: usd.toFixed(2) };
}

/** Verify captured PayPal amount matches invoice total. */
export function captureMatchesInvoiceTotal(
  totalIdr: number,
  captured: { currency_code?: string; value?: string }
): boolean {
  const expected = invoiceTotalToPayPalAmount(totalIdr);
  const code = (captured.currency_code ?? "").toUpperCase();
  if (code !== expected.currency_code) {
    return false;
  }

  if (expected.currency_code === "IDR") {
    return Math.round(Number(captured.value)) === Math.round(Number(expected.value));
  }

  const diff = Math.abs(Number(captured.value) - Number(expected.value));
  return diff < 0.02;
}
