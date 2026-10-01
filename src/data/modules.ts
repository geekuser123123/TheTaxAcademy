// Member learning modules and admin forms in the client portal, in the same order as the
// WordPress member portal. Lesson content is added to src/content/learn/ page by page;
// until a page has content, the portal shows a short "being moved" notice.

import type { IconName } from '../components/icons';

export interface Lesson {
  slug: string;
  title: string;
  /** Nested pages (e.g. individual banks under Bank Accounts). */
  children?: Lesson[];
}

export interface Module {
  slug: string;
  number: number;
  title: string;
  summary: string;
  cta: string;
  icon: IconName;
  lessons: Lesson[];
}

export const modules: Module[] = [
  {
    slug: 'setting-up-your-401k',
    number: 1,
    title: 'Setting Up Your 401(k)',
    summary: 'How your plan was created and what documents make it legally exist.',
    cta: 'Explore Setup',
    icon: 'layers',
    lessons: [
      { slug: 'setup-steps', title: 'Setup Steps' },
      { slug: 'plan-documents-package', title: 'Plan Documents Package' },
    ],
  },
  {
    slug: 'opening-accounts',
    number: 2,
    title: 'Opening Accounts',
    summary: 'Bank and brokerage accounts at Solera, Titan, E*TRADE, Fidelity, Schwab & TD.',
    cta: 'Open Accounts',
    icon: 'wallet',
    lessons: [
      {
        slug: 'bank-accounts',
        title: 'Bank Accounts',
        children: [
          { slug: 'solera-national-bank', title: 'Solera National Bank' },
          { slug: 'titan-bank', title: 'Titan Bank' },
        ],
      },
      {
        slug: 'brokerage-accounts',
        title: 'Brokerage Accounts',
        children: [
          { slug: 'etrade', title: 'E*TRADE' },
          { slug: 'fidelity', title: 'Fidelity' },
          { slug: 'charles-schwab', title: 'Charles Schwab' },
          { slug: 'td-ameritrade', title: 'TD Ameritrade' },
        ],
      },
    ],
  },
  {
    slug: 'contributions',
    number: 3,
    title: 'Contributions',
    summary: 'Calculate self-employment income, contribution types, limits, deadlines & reporting.',
    cta: 'Understand Contributions',
    icon: 'clock',
    lessons: [
      { slug: 'general-overview', title: 'General Overview' },
      { slug: 'calculating-self-employment-income', title: 'Calculating Self-Employment Income' },
      { slug: 'types-limits-deadlines', title: 'Types, Limits & Deadlines' },
      { slug: 'making-the-contribution', title: 'Making the Contribution' },
      { slug: 'reporting-the-contributions', title: 'Reporting the Contributions' },
    ],
  },
  {
    slug: 'rollovers',
    number: 4,
    title: 'Rollovers',
    summary: 'Direct & indirect rollovers, what accounts qualify, and how to report them.',
    cta: 'Learn Rollovers',
    icon: 'arrowRight',
    lessons: [
      { slug: 'general-overview', title: 'General Overview' },
      { slug: 'what-accounts-can-i-roll-in', title: 'What Accounts Can I Roll In?' },
      { slug: 'direct-rollovers', title: 'Direct Rollovers' },
      { slug: 'indirect-60-day-rollovers', title: 'In-Direct (60 Day) Rollovers' },
      { slug: 'reporting-the-rollover', title: 'Reporting the Rollover' },
    ],
  },
  {
    slug: 'participant-loans',
    number: 5,
    title: 'Participant Loans',
    summary: 'Calculate loans, interest & payments. Formalize multiple loans and handle defaults.',
    cta: 'Loan Rules',
    icon: 'listChecks',
    lessons: [
      { slug: 'general-overview', title: 'General Overview' },
      { slug: 'calculating-loan-interest-payments', title: 'Calculating Loan, Interest & Payments' },
      { slug: 'formalizing-making-payments', title: 'Formalizing & Making Payments' },
      { slug: 'taking-multiple-loans', title: 'Taking Multiple Loans' },
      { slug: 'reporting-defaulted-loans', title: 'Reporting Defaulted Loans' },
    ],
  },
  {
    slug: 'distributions',
    number: 6,
    title: 'Distributions',
    summary: 'Qualifying rules, required minimum distributions, and how to process and report.',
    cta: 'Distribution Guide',
    icon: 'arrowUpRight',
    lessons: [
      { slug: 'general-overview', title: 'General Overview' },
      { slug: 'distribution-qualifying-rules', title: 'Distribution Qualifying Rules' },
      { slug: 'required-minimum-distributions', title: 'Required Minimum Distributions' },
      { slug: 'processing-reporting', title: 'Processing & Reporting' },
    ],
  },
  {
    slug: 'annual-requirements',
    number: 7,
    title: 'Annual Requirements',
    summary: 'Form 5500-EZ, record maintenance, and your year-end maintenance checklist.',
    cta: 'Annual Checklist',
    icon: 'calendarCheck',
    lessons: [
      { slug: 'general-overview', title: 'General Overview' },
      { slug: 'form-5500-ez', title: 'Form 5500-EZ' },
      { slug: 'maintaining-records', title: 'Maintaining Records' },
      { slug: 'year-end-maintenance-checklist', title: 'Year-End Maintenance Checklist' },
    ],
  },
];

export interface AdminForm {
  slug: string;
  title: string;
  description: string;
}

export const adminForms: AdminForm[] = [
  { slug: 'contribution', title: 'Contribution Admin Form', description: 'Record employee & employer contributions' },
  { slug: 'roth-conversion', title: 'Roth Conversion Form', description: 'In-plan Roth rollover / conversion' },
  { slug: 'termination-order', title: 'Termination Order', description: 'Formally terminate your Solo 401(k) plan' },
  { slug: 'trustee-removal', title: 'Removal of 401(k) Trustee', description: 'Remove or replace a plan trustee' },
  { slug: 'form-5500-ez-filing', title: 'Form 5500-EZ Filing', description: 'Annual IRS filing for your Solo 401(k) plan' },
];

export const moduleHref = (m: Module) => `/portal/learn/${m.slug}`;
export const lessonHref = (m: Module, ...path: string[]) => `/portal/learn/${m.slug}/${path.join('/')}`;

/** Finds a lesson by its path inside a module, e.g. ['bank-accounts', 'titan-bank']. */
export function findLesson(m: Module, path: string[]): { lesson: Lesson; trail: Lesson[] } | null {
  let list = m.lessons;
  const trail: Lesson[] = [];
  for (const slug of path) {
    const found = list.find((l) => l.slug === slug);
    if (!found) return null;
    trail.push(found);
    list = found.children ?? [];
  }
  return trail.length ? { lesson: trail[trail.length - 1], trail } : null;
}
