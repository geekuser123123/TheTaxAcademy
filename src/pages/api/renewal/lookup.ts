import type { APIRoute } from 'astro';
import { lookupAccount, maskedAccount, renewalConfigured, sameOrigin } from '../../../lib/renewal';
import { accountFee, computeYearsBehind } from '../../../data/renewal';
import { isEmail } from '../../../lib/format';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403);
  if (!renewalConfigured()) return json({ error: 'unavailable' }, 503);

  let email = '';
  try {
    email = String(((await request.json()) as { email?: unknown }).email ?? '').trim();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  if (!isEmail(email)) return json({ error: 'email' }, 400);

  try {
    const account = await lookupAccount(email);
    if (!account) return json({ found: false });
    const yearsBehind = computeYearsBehind(account.last_paid_year);
    return json({ found: true, account: maskedAccount(account), yearsBehind, fee: accountFee(yearsBehind) });
  } catch (err) {
    console.error('renewal lookup failed', err);
    return json({ error: 'lookup_failed' }, 502);
  }
};
