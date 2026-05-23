import { getPayPalConfig, invoiceTotalToPayPalAmount } from "@/lib/paypal/config";

type AccessTokenCache = {
  token: string;
  expiresAtMs: number;
};

let tokenCache: AccessTokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAtMs - 60_000) {
    return tokenCache.token;
  }

  const { clientId, clientSecret, baseUrl } = getPayPalConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    const detail = data.error_description ?? data.error ?? res.statusText;
    throw new Error(`PayPal authentication failed: ${detail}`);
  }

  const expiresInSec = Number(data.expires_in) || 300;
  tokenCache = {
    token: data.access_token,
    expiresAtMs: now + expiresInSec * 1000,
  };

  return data.access_token;
}

async function paypalRequest<T>(
  path: string,
  options: { method: "POST" | "GET"; body?: unknown }
): Promise<T> {
  const { baseUrl } = getPayPalConfig();
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = (await res.json()) as T & {
    message?: string;
    details?: Array<{ issue?: string; description?: string }>;
  };

  if (!res.ok) {
    const detail =
      data.details?.map((d) => d.description ?? d.issue).filter(Boolean).join("; ") ||
      data.message ||
      res.statusText;
    throw new Error(detail || "PayPal API request failed.");
  }

  return data;
}

export type PayPalCreateOrderResult = {
  id: string;
  status: string;
};

export async function createPayPalOrder(params: {
  invoiceId: number;
  invoiceNumber: string;
  totalIdr: number;
}): Promise<PayPalCreateOrderResult> {
  const amount = invoiceTotalToPayPalAmount(params.totalIdr);

  return paypalRequest<PayPalCreateOrderResult>("/v2/checkout/orders", {
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: String(params.invoiceId),
          custom_id: `invoice_${params.invoiceId}`,
          description: params.invoiceNumber.slice(0, 127),
          amount,
        },
      ],
      application_context: {
        brand_name: "Telagacipta",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    },
  });
}

export type PayPalCaptureResult = {
  id: string;
  status: string;
  purchase_units?: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  const encoded = encodeURIComponent(orderId);
  return paypalRequest<PayPalCaptureResult>(`/v2/checkout/orders/${encoded}/capture`, {
    method: "POST",
    body: {},
  });
}

export function extractCaptureFromOrder(capture: PayPalCaptureResult): {
  captureId: string;
  orderId: string;
  invoiceId: number;
  amount: { currency_code?: string; value?: string };
} | null {
  if (capture.status !== "COMPLETED") {
    return null;
  }

  const unit = capture.purchase_units?.[0];
  const payment = unit?.payments?.captures?.[0];
  if (!payment || payment.status !== "COMPLETED") {
    return null;
  }

  const ref = unit?.reference_id ?? unit?.custom_id?.replace(/^invoice_/, "");
  const invoiceId = Number(ref);
  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return null;
  }

  const value = payment.amount?.value;
  if (!value || Number(value) <= 0) {
    return null;
  }

  return {
    captureId: payment.id,
    orderId: capture.id,
    invoiceId,
    amount: payment.amount ?? {},
  };
}
