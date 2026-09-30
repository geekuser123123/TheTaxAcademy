// Renewal pricing, shared by the renewal page (display) and the payment API (charging).
//
// Prices and fee rules are carried over unchanged from the existing WordPress renewal
// checkout, which is connected to the n8n workflow and Square. The server always
// recalculates the total from this file; the browser's total is display-only.

export interface RenewalTerm {
  id: string;
  years: number;
  price: number;
  label: string;
  saving?: string;
  badge?: string;
}

export interface RenewalService {
  id: string;
  /** Field name the n8n workflow expects in the payment payload. */
  payloadKey: 'addon_5500' | 'addon_joinder' | 'addon_amend';
  price: number;
  label: string;
  description: string;
  info?: string;
}

export const renewalTerms: RenewalTerm[] = [
  { id: '1y', years: 1, price: 200, label: 'One Year of Plan Maintenance' },
  {
    id: '2y',
    years: 2,
    price: 375,
    label: 'Two Years of Plan Maintenance',
    saving: 'Save $25 compared with two one-year renewals.',
  },
  {
    id: '3y',
    years: 3,
    price: 545,
    label: 'Three Years of Plan Maintenance',
    saving: 'Save $55 compared with three one-year renewals.',
    badge: 'Lowest Annual Cost',
  },
];

export const form5500Explanation =
  'Filing is generally required when the combined year-end assets of the employer’s one-participant plans exceed $250,000. A final-year return is generally required regardless of asset amount. Contact our team if you need help determining what applies.';

export const renewalServices: RenewalService[] = [
  {
    id: 'form-5500-ez',
    payloadKey: 'addon_5500',
    price: 250,
    label: 'Form 5500-EZ Preparation Assistance',
    // TODO(confirm): state whether this service includes submitting the return or preparation only.
    description: 'Assistance preparing the annual return when applicable.',
    info: form5500Explanation,
  },
  {
    id: 'plan-sponsor-update',
    payloadKey: 'addon_joinder',
    price: 150,
    label: 'Plan Sponsor Update',
    description: 'Document support for a qualifying change involving the sponsoring business.',
  },
  {
    id: 'requested-amendment',
    payloadKey: 'addon_amend',
    price: 100,
    label: 'Requested Plan Amendment',
    description: 'Document support for requested changes to trustees, plan details, or provisions.',
  },
];

// Existing approved termination service. Paid on its own, never combined with a renewal.
export const terminationFee = 500;

// Account fees, from the existing checkout. They depend on the account's last paid year,
// so they are only shown once the member's email has been verified.
// TODO(confirm): the existing checkout labels the $45 charge "Reinstatement Fee" and adds it
// to every renewal that is not behind. Confirm the label and when it should apply.
export const REINSTATEMENT_FEE = 45;
export const PENALTY_PER_YEAR = 200;
export const CAPPED_PENALTY_YEARS = 2;
export const COMPLIANCE_SURCHARGE = 100;

/** Years behind, from the last paid year (same rule as the existing checkout). */
export function computeYearsBehind(lastPaidYear: unknown, now = new Date()): number {
  const year = Number(lastPaidYear);
  if (!year || Number.isNaN(year)) return 0;
  const behind = now.getFullYear() - year - 1;
  return behind > 0 ? behind : 0;
}

export function accountFee(yearsBehind: number): { label: string; amount: number } {
  if (yearsBehind >= 3) {
    return {
      label: `Compliance Fee (${yearsBehind} Years Behind)`,
      amount: CAPPED_PENALTY_YEARS * PENALTY_PER_YEAR + COMPLIANCE_SURCHARGE,
    };
  }
  if (yearsBehind >= 1) {
    return {
      label: `Compliance Fee (${yearsBehind} Year${yearsBehind > 1 ? 's' : ''} Behind)`,
      amount: yearsBehind * PENALTY_PER_YEAR,
    };
  }
  return { label: 'Reinstatement Fee', amount: REINSTATEMENT_FEE };
}

export interface CheckoutSelection {
  termId: string;
  serviceIds: string[];
  termination: boolean;
  /** null until the account is verified; account fees are then left out. */
  yearsBehind: number | null;
}

export interface CheckoutLine {
  label: string;
  amount: number;
}

/** Itemized lines and total for a selection. Unknown ids are ignored. */
export function computeCheckout(sel: CheckoutSelection) {
  if (sel.termination) {
    const lines: CheckoutLine[] = [{ label: 'Plan Termination Service', amount: terminationFee }];
    return { lines, total: terminationFee, term: undefined, services: [] as RenewalService[] };
  }
  const term = renewalTerms.find((t) => t.id === sel.termId);
  const services = renewalServices.filter((s) => sel.serviceIds.includes(s.id));
  const lines: CheckoutLine[] = [];
  if (term) lines.push({ label: term.label, amount: term.price });
  for (const s of services) lines.push({ label: s.label, amount: s.price });
  if (sel.yearsBehind !== null) lines.push(accountFee(sel.yearsBehind));
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { lines, total, term, services };
}

export const money = (n: number) => `$${n.toLocaleString('en-US')}`;

// Square Web Payments (production). These identify the Square application and location
// and are designed to be public; the card is tokenized in the browser and charged by n8n.
export const square = {
  appId: 'sq0idp-DTb6CjLNe0dKI5mC6WfGIg',
  locationId: 'DVT3FB1VG130P',
  sdkUrl: 'https://web.squarecdn.com/v1/square.js',
};
