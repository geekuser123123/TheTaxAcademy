// Keeps portal accounts in step with renewal payments (replaces the WordPress step that
// created a member account after checkout).

import { createAuthLink } from './auth';
import { db, newId } from './db';
import { addYears, getProfile, saveProfile, today } from './profile';
import { sendEmail } from './notify';
import { site } from '../data/site';

export interface PaidRenewal {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  business: string;
  clientId: string;
  termination: boolean;
  years: number | null;
  /** Payload keys of the services paid for (addon_5500, addon_joinder, addon_amend). */
  services: string[];
  total: number;
  reference: string | null;
}

export interface MembershipResult {
  userId: string | null;
  created: boolean;
  /** For a new account: whether the set-password email went out. */
  emailed: boolean;
}

/**
 * Creates the member's portal account if needed and records the payment on their plan
 * details: a renewal moves the renewal date to today and extends the expiration date by
 * the term (from the current expiration date if it hasn't passed yet).
 */
export async function applyRenewal(origin: string, p: PaidRenewal): Promise<MembershipResult> {
  const existing = await db()
    .prepare('SELECT id, role FROM users WHERE email = ?')
    .bind(p.email)
    .first<{ id: string; role: string }>();
  // Never touch team accounts.
  if (existing && existing.role !== 'client') return { userId: null, created: false, emailed: false };

  const name = `${p.firstName} ${p.lastName}`.trim() || p.email.split('@')[0];
  let userId = existing?.id;
  const created = !userId;
  if (!userId) {
    userId = newId();
    await db()
      .prepare("INSERT INTO users (id, email, name, company, phone, role) VALUES (?, ?, ?, ?, ?, 'client')")
      .bind(userId, p.email, name, p.business || null, p.phone || null)
      .run();
  }

  const profile = await getProfile(userId);
  const values: Record<string, string | number | null> = {
    payment_status: 'Paid',
    total_paid: String(p.total),
    transaction_id: p.reference,
  };
  if (created) {
    Object.assign(values, {
      first_name: p.firstName || null,
      last_name: p.lastName || null,
      participant_name: name,
      email_address: p.email,
      phone_number: p.phone || null,
      business_name: p.business || null,
      zoho_client_id: p.clientId || null,
    });
  }
  if (p.termination) {
    values.cancellation = 1;
  } else if (p.years) {
    const start = profile?.expiry_date && profile.expiry_date >= today() ? profile.expiry_date : today();
    Object.assign(values, {
      renewal_date: today(),
      expiry_date: addYears(start, p.years),
      renewal_type: `${p.years} Year${p.years > 1 ? 's' : ''}`,
      plan_status: 'Active',
      cancellation: 0,
    });
    if (p.services.includes('addon_5500')) values.addon_5500ez = 1;
    if (p.services.includes('addon_joinder')) values.addon_joinder = 1;
    if (p.services.includes('addon_amend')) values.addon_amendment = 1;
  }
  await saveProfile(userId, values);

  let emailed = false;
  if (created && !p.termination) {
    const link = await createAuthLink(origin, userId, 'invite');
    emailed = await sendEmail(
      p.email,
      `Your ${site.name} member portal is ready`,
      [
        `Hi ${p.firstName || name},`,
        '',
        `Thank you for renewing with ${site.name}. Your member portal account is ready.`,
        '',
        'Set your password here (this link works once and expires in 7 days):',
        link,
        '',
        `After that, sign in any time at ${origin}/portal/login`,
        '',
        `Questions? Call us at ${site.phone}.`,
        '',
        site.name,
      ].join('\n'),
    );
  }
  return { userId, created, emailed };
}
