import type { APIRoute } from 'astro';
import { lookupAccount, renewalConfigured, sameOrigin, submitPayment } from '../../../lib/renewal';
import { computeCheckout, computeYearsBehind, money, renewalServices, renewalTerms } from '../../../data/renewal';
import { db, newId } from '../../../lib/db';
import { isEmail } from '../../../lib/format';
import { notifyTeam } from '../../../lib/notify';
import { applyRenewal, type MembershipResult } from '../../../lib/membership';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

interface PayRequest {
  email?: unknown;
  termId?: unknown;
  serviceIds?: unknown;
  termination?: unknown;
  sourceId?: unknown;
}

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return json({ success: false, error: 'Request not allowed.' }, 403);
  if (!renewalConfigured()) {
    return json({ success: false, error: 'Online renewal is temporarily unavailable. Please call us to renew.' }, 503);
  }

  let body: PayRequest;
  try {
    body = (await request.json()) as PayRequest;
  } catch {
    return json({ success: false, error: 'Invalid request.' }, 400);
  }

  const email = String(body.email ?? '').trim();
  const sourceId = String(body.sourceId ?? '').trim();
  const termination = body.termination === true;
  const termId = String(body.termId ?? '');
  const serviceIds = Array.isArray(body.serviceIds)
    ? body.serviceIds.map(String).filter((id) => renewalServices.some((s) => s.id === id))
    : [];

  if (!isEmail(email)) return json({ success: false, error: 'Please verify your email address.' }, 400);
  if (!sourceId || sourceId.length > 500) return json({ success: false, error: 'Please enter your card details.' }, 400);
  if (!termination && !renewalTerms.some((t) => t.id === termId)) {
    return json({ success: false, error: 'Please choose a maintenance term.' }, 400);
  }

  // Look the account up again here: the page's copy of it is never trusted for pricing.
  let account;
  try {
    account = await lookupAccount(email);
  } catch (err) {
    console.error('renewal lookup failed', err);
    return json({ success: false, error: 'We could not verify your account right now. Please try again.' }, 502);
  }
  if (!account) return json({ success: false, error: 'No account found with this email. Please contact us.' }, 400);

  const yearsBehind = computeYearsBehind(account.last_paid_year);
  const checkout = computeCheckout({ termId, serviceIds, termination, yearsBehind });
  const addon = (key: string) => !termination && checkout.services.some((s) => s.payloadKey === key);

  let renewalType = 'Standard Renewal';
  if (termination) renewalType = 'Cancellation';
  else if (checkout.term!.years > 1) renewalType = 'Multi-Year Renewal';
  else if (checkout.services.length) renewalType = 'Renewal with Add-Ons';

  // Same fields the WordPress checkout sends, so the n8n workflow runs unchanged.
  const payload = {
    client_id: account.client_id,
    first_name: account.first_name,
    last_name: account.last_name,
    email,
    phone: account.phone,
    business: account.business,
    term: termination ? null : checkout.term!.years,
    addon_5500: addon('addon_5500'),
    addon_joinder: addon('addon_joinder'),
    addon_amend: addon('addon_amend'),
    cancellation: termination,
    years_behind: yearsBehind,
    renewal_type: renewalType,
    total_paid: checkout.total,
    payment_status: 'paid',
    square_transaction_id: sourceId,
    renewal_submission_date: new Date().toISOString().split('T')[0],
    source: 'renewal_page',
    amount_cents: Math.round(checkout.total * 100),
    currency: 'USD',
    square_source_id: sourceId,
  };

  let result;
  try {
    result = await submitPayment(payload);
  } catch (err) {
    // Timeout or network failure: the charge may or may not have gone through.
    console.error('renewal payment webhook failed', err);
    return json(
      {
        success: false,
        error:
          'We could not confirm the result of your payment. Please check your email for a receipt before trying again, or call us.',
      },
      502,
    );
  }
  if (!result.success) return json({ success: false, error: result.error }, 402);

  // Pass through any payment reference n8n returns (e.g. Square payment id or receipt link).
  const pick = (...keys: string[]) => {
    for (const k of keys) if (typeof result.data[k] === 'string' && result.data[k]) return result.data[k] as string;
    return null;
  };
  const reference = pick('payment_id', 'transaction_id', 'square_payment_id', 'reference');
  const receiptUrl = pick('receipt_url');

  // Create or update the member's portal account and plan dates.
  let membership: MembershipResult | null = null;
  try {
    membership = await applyRenewal(new URL(request.url).origin, {
      email,
      firstName: account.first_name,
      lastName: account.last_name,
      phone: account.phone,
      business: account.business,
      clientId: account.client_id ?? '',
      termination,
      years: termination ? null : checkout.term!.years,
      services: checkout.services.map((s) => s.payloadKey),
      total: checkout.total,
      reference,
    });
  } catch (err) {
    console.error('renewal account update failed', err);
  }

  // Record it for the team workspace.
  try {
    const client = membership?.userId ? { id: membership.userId } : null;
    const record: Record<string, string> = {
      'Paid for': termination ? 'Plan termination service' : 'Plan maintenance renewal',
      'Items': checkout.lines.map((l) => `${l.label} — ${money(l.amount)}`).join('\n'),
      'Total paid': money(checkout.total),
      'Payment status': 'Paid (confirmed by payment workflow)',
    };
    if (reference) record['Payment reference'] = reference;
    if (membership?.created) {
      record['Portal account'] = membership.emailed
        ? 'Created; set-password email sent'
        : 'Created; email not sent. Send an invite link from the client page in the team workspace.';
    } else if (!membership) {
      record['Portal account'] = 'Not updated (error). Check the client’s plan details in the team workspace.';
    }
    await db()
      .prepare(
        `INSERT INTO submissions (id, form_slug, name, email, phone, plan_name, payload, client_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId(),
        termination ? 'termination-payment' : 'renewal',
        `${account.first_name} ${account.last_name}`.trim() || email,
        email,
        account.phone || null,
        account.business || null,
        JSON.stringify(record),
        client?.id ?? null,
      )
      .run();
    await notifyTeam(
      `${termination ? 'Termination service' : 'Renewal'} paid: ${account.first_name} ${account.last_name}`,
      Object.entries(record)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n'),
    );
  } catch (err) {
    // The payment succeeded; never report failure to the member because of our own bookkeeping.
    console.error('renewal record failed', err);
  }

  return json({
    success: true,
    receipt: {
      termination,
      lines: checkout.lines,
      total: checkout.total,
      date: new Date().toISOString(),
      reference,
      receiptUrl,
    },
  });
};
