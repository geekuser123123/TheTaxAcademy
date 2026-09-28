// Public request forms. Anyone can submit these without signing in to the portal.
// Every form also collects name, email, phone, and plan name (see FormFields).

export type Field =
  | { name: string; label: string; type: 'text' | 'date' | 'email' | 'tel'; required?: boolean; hint?: string }
  | { name: string; label: string; type: 'textarea'; required?: boolean; hint?: string }
  | { name: string; label: string; type: 'select'; options: string[]; required?: boolean; hint?: string };

export interface RequestForm {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  group: 'Plan documents' | 'Reporting & renewals' | 'Participants' | 'Talk to the team';
  intro: string;
  fields: Field[];
  featured?: boolean;
}

export const forms: RequestForm[] = [
  {
    slug: 'document-request',
    title: 'Request a document',
    summary: 'Find a missing plan document or ask for a copy.',
    minutes: 3,
    group: 'Plan documents',
    featured: true,
    intro:
      'Tell us which document you need. If you are not sure of the name, describe what you are looking for and we will find it.',
    fields: [
      {
        name: 'document_type',
        label: 'Which document do you need?',
        type: 'select',
        required: true,
        options: [
          'Plan document / basic plan document',
          'Adoption agreement',
          'Summary plan description (SPD)',
          'Trust agreement',
          'Amendment or restatement',
          'EIN confirmation letter',
          'Form 5500-EZ copy',
          'Not sure / other',
        ],
      },
      { name: 'details', label: 'Anything else we should know?', type: 'textarea', hint: 'Tax year, who is asking for it, deadline, etc.' },
    ],
  },
  {
    slug: 'annual-reporting',
    title: 'Annual reporting / Form 5500-EZ',
    summary: 'Start a reporting review or request preparation help.',
    minutes: 5,
    group: 'Reporting & renewals',
    featured: true,
    intro:
      'Share the basics for the plan year. We will confirm what is required and what we need from you before anything is prepared.',
    fields: [
      { name: 'plan_year', label: 'Plan year', type: 'text', required: true, hint: 'For example, 2025' },
      {
        name: 'year_end_balance',
        label: 'Approximate total plan assets at year end',
        type: 'select',
        required: true,
        options: ['Under $250,000', '$250,000 or more', 'Not sure'],
      },
      {
        name: 'help_type',
        label: 'What would you like help with?',
        type: 'select',
        required: true,
        options: ['Review whether a filing is required', 'Prepare Form 5500-EZ', 'Late or missed filing', 'Other'],
      },
      { name: 'details', label: 'Notes', type: 'textarea', hint: 'Custodian or account names, prior filings, deadlines.' },
    ],
  },
  {
    slug: 'plan-amendment',
    title: 'Plan amendment or update',
    summary: 'Request changes to trustees, plan details, or features.',
    minutes: 4,
    group: 'Plan documents',
    featured: true,
    intro:
      'Describe the change you want to make. We will review whether it needs an amendment and confirm scope before any work begins.',
    fields: [
      {
        name: 'change_type',
        label: 'What is changing?',
        type: 'select',
        required: true,
        options: [
          'Trustee change',
          'Business name, address, or EIN',
          'Add or remove a participant',
          'Add a feature (loans, Roth, after-tax, etc.)',
          'Required regulatory restatement',
          'Other',
        ],
      },
      { name: 'effective_date', label: 'Desired effective date', type: 'date' },
      { name: 'details', label: 'Describe the change', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'participant-loan',
    title: 'Participant loan request',
    summary: 'Ask about loan eligibility, documents, or repayments.',
    minutes: 5,
    group: 'Participants',
    featured: true,
    intro:
      'Loans must follow your plan document and IRS rules. Share what you have in mind and we will confirm what is allowed and what paperwork is needed.',
    fields: [
      { name: 'participant_name', label: 'Participant name', type: 'text', required: true },
      {
        name: 'loan_topic',
        label: 'What do you need?',
        type: 'select',
        required: true,
        options: ['New loan', 'Loan documents / promissory note', 'Repayment question', 'Missed payment', 'Other'],
      },
      { name: 'amount', label: 'Approximate amount (if a new loan)', type: 'text' },
      { name: 'details', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    slug: 'renewal',
    title: 'Annual renewal',
    summary: 'Renew your 401(k) license or statutory agent service.',
    minutes: 2,
    group: 'Reporting & renewals',
    intro:
      'Let us know what you are renewing. We will confirm your renewal details and send payment instructions.',
    fields: [
      {
        name: 'renewal_type',
        label: 'What are you renewing?',
        type: 'select',
        required: true,
        options: ['401(k) annual license fee', 'Statutory agent renewal', 'Both', 'Not sure'],
      },
      { name: 'business_name', label: 'Business / LLC name', type: 'text' },
      { name: 'details', label: 'Notes', type: 'textarea', hint: 'Any changes to your business or contact details?' },
    ],
  },
  {
    slug: 'business-update',
    title: 'Business or records update',
    summary: 'Business changed or records need attention? Start here.',
    minutes: 3,
    group: 'Plan documents',
    intro:
      'New address, new owner, new employees, a closed business, or records that need catching up. Tell us what changed.',
    fields: [
      {
        name: 'update_type',
        label: 'What changed?',
        type: 'select',
        required: true,
        options: [
          'Contact or address change',
          'Ownership change',
          'Hiring employees',
          'Business closed or sold',
          'Records need catching up',
          'Other',
        ],
      },
      { name: 'details', label: 'Describe what changed', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'contact-team',
    title: 'Ask the team',
    summary: 'Start with a real person on the team.',
    minutes: 2,
    group: 'Talk to the team',
    intro: 'Tell us what is going on. We will help you find the right next step.',
    fields: [
      {
        name: 'topic',
        label: 'Topic',
        type: 'select',
        options: ['General question', 'Portal access help', 'Billing', 'Something else'],
      },
      { name: 'details', label: 'Your message', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'advanced-planning',
    title: 'Advanced planning idea',
    summary: 'You don’t need the name of a service. Bring us the idea.',
    minutes: 4,
    group: 'Talk to the team',
    intro:
      'Describe the result you want. We will organize the facts, bring in the right professional, and agree on scope and fees before any work starts.',
    fields: [
      {
        name: 'area',
        label: 'Closest area',
        type: 'select',
        options: [
          'Funding & Roth planning',
          'Trusts & family legacy',
          'Real estate, LLCs & investments',
          'Asset protection',
          'Taxes, distributions & review',
          'Not sure',
        ],
      },
      { name: 'details', label: 'What are you trying to accomplish?', type: 'textarea', required: true },
      {
        name: 'timeline',
        label: 'Timeline',
        type: 'select',
        options: ['No rush', 'Within a few months', 'Within a few weeks', 'Urgent'],
      },
    ],
  },
];

export const getForm = (slug: string) => forms.find((f) => f.slug === slug);
