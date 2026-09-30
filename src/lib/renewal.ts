// Server-side bridge to the existing n8n renewal workflow.
// Webhook URLs are Worker secrets, so they never appear in the page source.

import { env } from 'cloudflare:workers';

type RenewalEnv = {
  RENEWAL_LOOKUP_WEBHOOK_URL?: string;
  RENEWAL_PAYMENT_WEBHOOK_URL?: string;
  /** Optional shared secret sent as `x-webhook-secret`, so n8n can reject other callers. */
  RENEWAL_WEBHOOK_SECRET?: string;
};

const config = () => env as unknown as RenewalEnv;

export const renewalConfigured = () =>
  Boolean(config().RENEWAL_LOOKUP_WEBHOOK_URL && config().RENEWAL_PAYMENT_WEBHOOK_URL);

export interface Account {
  client_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  business: string;
  last_paid_year: number | null;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const secret = config().RENEWAL_WEBHOOK_SECRET;
  if (secret) h['x-webhook-secret'] = secret;
  return h;
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

/** Looks the member up by email. Returns null when no account matches. Throws on transport errors. */
export async function lookupAccount(email: string): Promise<Account | null> {
  const res = await fetch(config().RENEWAL_LOOKUP_WEBHOOK_URL!, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`lookup webhook responded ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  if (!data?.found) return null;
  const year = Number(data.last_paid_year);
  return {
    client_id: data.client_id == null ? null : text(data.client_id),
    first_name: text(data.first_name),
    last_name: text(data.last_name),
    phone: text(data.phone),
    business: text(data.business),
    last_paid_year: year && !Number.isNaN(year) ? year : null,
  };
}

export type PaymentResult = { success: true; data: Record<string, unknown> } | { success: false; error: string };

/** Sends the payment payload to n8n, which charges the Square token and records the renewal. */
export async function submitPayment(payload: Record<string, unknown>): Promise<PaymentResult> {
  const res = await fetch(config().RENEWAL_PAYMENT_WEBHOOK_URL!, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45_000),
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // fall through with empty data
  }
  if (res.ok && data?.success) return { success: true, data };
  const error =
    typeof data?.error === 'string' && data.error
      ? data.error
      : 'There was a problem processing your payment. Please check your card details and try again.';
  return { success: false, error };
}

/** What we show before payment: enough to recognize the account, not enough to harvest it. */
export function maskedAccount(a: Account) {
  const last4 = a.phone.replace(/\D/g, '').slice(-4);
  return {
    name: [a.first_name, a.last_name ? `${a.last_name[0]}.` : ''].filter(Boolean).join(' '),
    business: a.business,
    phoneLast4: last4.length === 4 ? last4 : '',
  };
}

/** Rejects cross-site requests to the JSON endpoints (Astro's origin check covers form posts only). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
