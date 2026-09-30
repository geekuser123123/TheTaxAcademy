// Public forms, handled by src/pages/api/submit.ts.
// Fields named `name`, `email`, `phone`, and `plan_name` are also stored in their own
// columns so the team workspace can search and link them to portal clients.

export type Field =
  | { name: string; label: string; type: 'text' | 'email' | 'tel'; required?: boolean; autocomplete?: string }
  | { name: string; label: string; type: 'textarea'; required?: boolean }
  | { name: string; label: string; type: 'select'; options: { value: string; label: string }[]; required?: boolean };

export interface PublicForm {
  slug: string;
  title: string;
  fields: Field[];
  /** Where to send the visitor after a successful submission. */
  successPath: string;
  /** Anchor of the form on its page, used when returning validation errors. */
  anchor: string;
}

export const planTypes = [
  { value: 'solo-401k', label: 'Solo or self-directed 401(k)' },
  { value: 'other-employer-plan', label: 'Other employer retirement plan' },
  { value: 'not-sure', label: 'Not sure' },
];

// `?topic=<value>` on /contact/ preselects the matching reason.
export const contactReasons = [
  { value: 'annual-renewal', label: 'Annual renewal' },
  { value: 'overdue-renewal', label: 'Overdue renewal' },
  { value: 'switching-providers', label: 'Switching providers' },
  { value: 'plan-document-change', label: 'Plan document change' },
  { value: 'form-5500-ez', label: 'Form 5500-EZ assistance' },
  { value: 'plan-termination', label: 'Plan termination' },
  { value: 'statutory-agent', label: 'Statutory agent service' },
  { value: 'other', label: 'Other' },
];

// Extra topic names used in links elsewhere on the site.
export const contactTopicAliases: Record<string, string> = {
  'renewal-help': 'annual-renewal',
};

export const forms: PublicForm[] = [
  {
    slug: 'switch-review',
    title: 'Provider review request',
    successPath: '/switch-providers/received/',
    anchor: 'request-review',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'email', label: 'Email address', type: 'email', required: true, autocomplete: 'email' },
      { name: 'plan_name', label: 'Business name', type: 'text', required: true, autocomplete: 'organization' },
      { name: 'plan_type', label: 'Plan type', type: 'select', required: true, options: planTypes },
      { name: 'phone', label: 'Phone number', type: 'tel', autocomplete: 'tel' },
      { name: 'current_provider', label: 'Current document or support provider', type: 'text' },
      { name: 'help', label: 'What would you like help with?', type: 'textarea' },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact request',
    successPath: '/contact/received/',
    anchor: 'contact-form',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, autocomplete: 'name' },
      { name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel' },
      { name: 'reason', label: 'Reason for contacting us', type: 'select', required: true, options: contactReasons },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },
];

// Titles for forms that earlier versions of the site used, so requests already in the
// database still display properly in the portal.
const legacyTitles: Record<string, string> = {
  // Paid online through /renewal-page/ (see src/pages/api/renewal/pay.ts)
  renewal: 'Plan maintenance renewal',
  'termination-payment': 'Plan termination service',
  'document-request': 'Request a document',
  'annual-reporting': 'Annual reporting / Form 5500-EZ',
  'plan-amendment': 'Plan amendment or update',
  'participant-loan': 'Participant loan request',
  'business-update': 'Business or records update',
  'contact-team': 'Ask the team',
  'advanced-planning': 'Advanced planning idea',
};

export function getForm(slug: string): { title: string } | undefined {
  const form = forms.find((f) => f.slug === slug);
  if (form) return form;
  return legacyTitles[slug] ? { title: legacyTitles[slug] } : undefined;
}

export const getPublicForm = (slug: string) => forms.find((f) => f.slug === slug);

export const optionLabel = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label;
