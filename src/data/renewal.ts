// Renewal terms and additional services shown on /renewal-page/.
//
// TODO(confirm): These are the prices currently advertised on the public renewal page.
// The old page also displayed $255 in several total fields. Reconcile every price here
// with the approved billing configuration before launch; do not guess at extra charges.

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
    price: 250,
    label: 'Form 5500-EZ Preparation Assistance',
    // TODO(confirm): state whether this service includes submitting the return or preparation only.
    description: 'Assistance preparing the annual return when applicable.',
    info: form5500Explanation,
  },
  {
    id: 'plan-sponsor-update',
    price: 150,
    label: 'Plan Sponsor Update',
    description: 'Document support for a qualifying change involving the sponsoring business.',
  },
  {
    id: 'requested-amendment',
    price: 100,
    label: 'Requested Plan Amendment',
    description: 'Document support for requested changes to trustees, plan details, or provisions.',
  },
];

// Existing approved termination service. Not part of renewal checkout.
export const terminationFee = 500; // TODO(confirm)

export const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Server- and client-safe total for a selection. Unknown ids are ignored. */
export function summarize(termId: string, serviceIds: string[]) {
  const term = renewalTerms.find((t) => t.id === termId);
  const services = renewalServices.filter((s) => serviceIds.includes(s.id));
  const total = (term?.price ?? 0) + services.reduce((sum, s) => sum + s.price, 0);
  return { term, services, total };
}
