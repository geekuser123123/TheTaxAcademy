// Client plan details (client_profiles). Field list mirrors the ACF user fields on the
// WordPress member portal; scripts/import-wordpress.mjs keeps the same mapping.

import { db } from './db';

export type FieldKind = 'text' | 'date' | 'bool';

export interface ProfileField {
  key: string;
  label: string;
  kind: FieldKind;
  /** ACF meta key on WordPress, when it differs from `key`. */
  acf?: string;
}

export const profileGroups: { title: string; fields: ProfileField[] }[] = [
  {
    title: 'Participant',
    fields: [
      { key: 'first_name', label: 'First name', kind: 'text' },
      { key: 'last_name', label: 'Last name', kind: 'text' },
      { key: 'participant_name', label: 'Participant name', kind: 'text' },
      { key: 'date_of_birth', label: 'Date of birth', kind: 'text' },
      { key: 'email_address', label: 'Email address', kind: 'text' },
      { key: 'phone_number', label: 'Phone number', kind: 'text' },
      { key: 'street_address', label: 'Street address', kind: 'text' },
      { key: 'city_state_zip', label: 'City, state, ZIP', kind: 'text' },
    ],
  },
  {
    title: 'Business',
    fields: [
      { key: 'business_name', label: 'Business name', kind: 'text' },
      { key: 'company_name', label: 'Company name', kind: 'text' },
      { key: 'entity_type', label: 'Entity type', kind: 'text' },
      { key: 'business_ein', label: 'Business EIN', kind: 'text' },
      { key: 'business_address', label: 'Business address', kind: 'text', acf: 'business_ad' },
      { key: 'ownership_of_other_business', label: 'Ownership of other businesses', kind: 'text' },
      { key: 'location_city', label: 'Location (city)', kind: 'text' },
      { key: 'location_state', label: 'Location (state)', kind: 'text' },
    ],
  },
  {
    title: 'Plan',
    fields: [
      { key: 'plan_sponsor', label: 'Plan sponsor', kind: 'text' },
      { key: 'plan_trustee', label: 'Plan trustee', kind: 'text' },
      { key: 'trustee_name', label: 'Trustee name', kind: 'text' },
      { key: 'co_trustee', label: 'Co-trustee', kind: 'text' },
      { key: 'spouse_name', label: 'Spouse name', kind: 'text' },
      { key: 'spouse_participant', label: 'Spouse participant', kind: 'text' },
      { key: 'spouse_phone_number', label: 'Spouse phone number', kind: 'text' },
      { key: 'spouse_email', label: 'Spouse email', kind: 'text' },
    ],
  },
  {
    title: 'Renewal & payment',
    fields: [
      { key: 'plan_status', label: 'Plan status', kind: 'text' },
      { key: 'renewal_type', label: 'Renewal type', kind: 'text' },
      { key: 'renewal_date', label: 'Renewal date', kind: 'date' },
      { key: 'expiry_date', label: 'Expiration date', kind: 'date' },
      { key: 'payment_status', label: 'Payment status', kind: 'text' },
      { key: 'course_access_status', label: 'Course access status', kind: 'text' },
      { key: 'total_paid', label: 'Total paid', kind: 'text' },
      { key: 'transaction_id', label: 'Transaction ID', kind: 'text' },
      { key: 'zoho_client_id', label: 'Zoho client ID', kind: 'text' },
      { key: 'addon_5500ez', label: 'Add-on: Form 5500-EZ', kind: 'bool' },
      { key: 'addon_joinder', label: 'Add-on: Joinder', kind: 'bool' },
      { key: 'addon_amendment', label: 'Add-on: Amendment', kind: 'bool' },
      { key: 'cancellation', label: 'Cancellation', kind: 'bool' },
      { key: 'form_5500ez_submitted', label: '5500-EZ submitted', kind: 'bool', acf: '5500ez_submitted' },
    ],
  },
];

export const profileFields = profileGroups.flatMap((g) => g.fields);

export type ClientProfile = Record<string, string | number | null> & {
  user_id: string;
  first_name: string | null;
  participant_name: string | null;
  business_name: string | null;
  entity_type: string | null;
  plan_trustee: string | null;
  trustee_name: string | null;
  location_city: string | null;
  location_state: string | null;
  plan_status: string | null;
  renewal_type: string | null;
  renewal_date: string | null;
  expiry_date: string | null;
  cancellation: number;
};

export async function getProfile(userId: string): Promise<ClientProfile | null> {
  return db().prepare('SELECT * FROM client_profiles WHERE user_id = ?').bind(userId).first<ClientProfile>();
}

/** Inserts or updates the given profile fields. Unknown keys are ignored. */
export async function saveProfile(userId: string, values: Record<string, string | number | null>): Promise<void> {
  const keys = profileFields.map((f) => f.key).filter((k) => k in values);
  if (!keys.length) return;
  const cols = ['user_id', ...keys];
  await db()
    .prepare(
      `INSERT INTO client_profiles (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
       ON CONFLICT(user_id) DO UPDATE SET ${keys.map((k) => `${k} = excluded.${k}`).join(', ')}, updated_at = datetime('now')`,
    )
    .bind(userId, ...keys.map((k) => values[k]))
    .run();
}

/** Today's date (YYYY-MM-DD) in the team's time zone. */
export function today(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Phoenix' });
}

/** Adds whole years to a YYYY-MM-DD date. */
export function addYears(date: string, years: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const out = new Date(Date.UTC(y + years, m - 1, d));
  // Feb 29 + n years lands on Mar 1; keep it on Feb 28 instead.
  if (out.getUTCMonth() !== m - 1) out.setUTCDate(0);
  return out.toISOString().slice(0, 10);
}

export function formatPlanDate(date: string | null | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '—';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export type PlanState = 'active' | 'expired' | 'cancelled' | 'unknown';

/**
 * Plan status shown to the client. Worked out from the expiration date so it can't go
 * stale; a cancellation (or a status the team set to "Cancelled") takes precedence.
 */
export function planState(p: ClientProfile | null): { state: PlanState; label: string; sub: string } {
  const status = (p?.plan_status ?? '').toLowerCase();
  if (p && (p.cancellation || status.includes('cancel') || status.includes('terminat'))) {
    return { state: 'cancelled', label: 'Cancelled', sub: 'Plan maintenance ended' };
  }
  if (p?.expiry_date) {
    return p.expiry_date >= today()
      ? { state: 'active', label: 'Active', sub: 'Maintenance active' }
      : { state: 'expired', label: 'Expired', sub: 'Renewal needed' };
  }
  if (status) return { state: 'unknown', label: p!.plan_status!, sub: '' };
  return { state: 'unknown', label: '—', sub: 'Contact us to confirm' };
}
