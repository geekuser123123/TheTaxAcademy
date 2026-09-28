import type { IconName } from '../components/icons';

export interface ServiceCategory {
  slug: string;
  title: string;
  summary: string;
  icon: IconName;
  intro: string;
  items: { title: string; text: string }[];
}

// Plan document services (the core practice), shown on /plan-support and the home page.
export const planServices: { title: string; text: string }[] = [
  {
    title: 'Preparation of self-directed 401(k) plan documents',
    text: 'We create the core IRS-compliant plan documents that legally establish your self-directed 401(k) and define how the plan operates.',
  },
  {
    title: 'Plan adoption agreements and related setup paperwork',
    text: 'We prepare and organize the required adoption agreements and setup forms needed to officially activate your plan and put it into effect.',
  },
  {
    title: 'Amendments and restatements, including required regulatory updates',
    text: 'We update your plan documents to reflect regulatory changes or plan modifications, so your 401(k) remains compliant over time.',
  },
  {
    title: 'Plan termination documentation',
    text: 'When a plan needs to be closed, we prepare the termination paperwork so the process is completed correctly and in line with IRS rules.',
  },
  {
    title: 'Assistance with EIN applications and administrative forms',
    text: 'We assist with obtaining plan-specific EINs and completing the administrative forms required to properly identify and operate your 401(k).',
  },
  {
    title: 'Ongoing document and compliance support as plans evolve',
    text: 'As your plan evolves, we provide continued document updates and compliance support to keep everything accurate, current, and properly maintained.',
  },
];

// Advanced work, usually scoped as a defined project with the right professional.
export const serviceCategories: ServiceCategory[] = [
  {
    slug: 'roth',
    title: 'Funding & Roth planning',
    summary: 'Contributions, conversions, and retirement income.',
    icon: 'arrowLeftRight',
    intro:
      'Put the plan to work. We help you understand contribution options, Roth features, and how money moves in and out of the plan.',
    items: [
      { title: 'Contribution planning', text: 'Understand employee and employer contribution options for your situation.' },
      { title: 'Roth features & in-plan conversions', text: 'Review whether Roth deferrals or conversions fit your plan and goals.' },
      { title: 'Rollovers into the plan', text: 'Organize the paperwork to move eligible retirement money into your 401(k).' },
      { title: 'Retirement income', text: 'Plan for distributions and required minimum distributions when the time comes.' },
    ],
  },
  {
    slug: 'trusts',
    title: 'Trusts & family legacy',
    summary: 'CRTs, advanced trusts, estates, and inheritance.',
    icon: 'users',
    intro:
      'Think beyond your own retirement. We coordinate with attorneys on trust and legacy work that connects to your plan and your family.',
    items: [
      { title: 'Charitable remainder trusts (CRTs)', text: 'Explore whether a CRT fits your giving and income goals.' },
      { title: 'Advanced trust structures', text: 'Coordinate trust work with the right attorney as a defined project.' },
      { title: 'Beneficiary planning', text: 'Keep beneficiary designations aligned with the rest of your plan.' },
      { title: 'Inherited accounts & estates', text: 'Understand options and deadlines when retirement assets pass to heirs.' },
    ],
  },
  {
    slug: 'transactions',
    title: 'Real estate, LLCs & investments',
    summary: 'Property, private lending, entities, and complex deals.',
    icon: 'building',
    intro:
      'Self-directed plans can hold more than stocks and funds. We help you organize alternative investments so the paperwork matches the rules.',
    items: [
      { title: 'Real estate in the plan', text: 'Document purchases, titling, and expenses the right way.' },
      { title: 'Private lending & notes', text: 'Organize promissory notes and loan documents held by the plan.' },
      { title: 'Entities & LLCs', text: 'Coordinate entity structures that interact with your plan.' },
      { title: 'Alternative assets', text: 'Move alternative assets into your 401(k) with a clear process.' },
    ],
  },
  {
    slug: 'protection',
    title: 'Asset protection',
    summary: 'Ownership, exposure, and protective documents.',
    icon: 'shieldCheck',
    intro:
      'Understand who owns what and where your exposure is. We bring in the right professional to put protective documents in place.',
    items: [
      { title: 'Ownership review', text: 'Map how assets are held across your plan, entities, and personal name.' },
      { title: 'Exposure review', text: 'Identify gaps worth discussing with an attorney.' },
      { title: 'Protective documents', text: 'Coordinate the documents that support your protection strategy.' },
    ],
  },
  {
    slug: 'compliance',
    title: 'Taxes, distributions & review',
    summary: 'UBIT, withdrawals, transaction rules, and reporting.',
    icon: 'clipboardCheck',
    intro:
      'Stay inside the lines. We help you review transactions, distributions, and reporting so there are no surprises.',
    items: [
      { title: 'UBIT / UDFI review', text: 'Understand when plan investments may create unrelated business taxable income.' },
      { title: 'Distributions & withdrawals', text: 'Organize the paperwork for in-service, hardship, or retirement distributions.' },
      { title: 'Prohibited transaction review', text: 'Check a proposed transaction against the rules before you act.' },
      { title: 'Reporting', text: 'Form 5500-EZ and related annual reporting support.' },
    ],
  },
];

export const getCategory = (slug: string) => serviceCategories.find((c) => c.slug === slug);
