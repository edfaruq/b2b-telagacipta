import { getBiteshipConfig } from "@/lib/biteship/config";

export class BiteshipApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "BiteshipApiError";
  }
}

type BiteshipJson = Record<string, unknown>;

export async function biteshipRequest<T extends BiteshipJson>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { apiKey, baseUrl } = getBiteshipConfig();
  const method = options.method ?? (options.body ? "POST" : "GET");

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    success?: boolean;
    error?: string;
    message?: string;
    code?: number;
    details?: unknown;
  };

  if (!res.ok || data.success === false) {
    const message =
      data.error ??
      data.message ??
      `Biteship request failed (${res.status} ${res.statusText})`;
    throw new BiteshipApiError(message, res.status, data.code, data.details);
  }

  return data;
}
