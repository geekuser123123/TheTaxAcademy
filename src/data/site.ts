// Single source for business details shown across the site.
// Values marked TODO(confirm) were read from a low-resolution screenshot
// and should be verified before launch.

export const site = {
  name: 'The Tax Academy',
  legalName: 'The Tax Academy, LLC',
  tagline: 'Plan support. Familiar people. A clear next step.',
  description:
    'Your home base for plan documents, public request forms, renewals, and advanced planning services.',
  phone: '(480) 466-0401',
  phoneHref: 'tel:+14804660401',
  email: '', // TODO(confirm): public contact email (hidden while empty)
  address: {
    line1: '2473 S Higley Rd, Ste. 104-117', // TODO(confirm)
    line2: 'Gilbert, AZ 85295', // TODO(confirm)
  },
  team: 'Tim or Brandee',
  // Sister site for establishing a new plan. Hidden while empty.
  rothAcademyUrl: '',
};

export const mainNav = [
  { href: '/forms', label: 'Forms & requests' },
  { href: '/plan-support', label: 'Plan support' },
  { href: '/services', label: 'Explore services' },
  { href: '/resources', label: 'Resources' },
  { href: '/contact', label: 'Contact' },
];

export const footerNav = [
  {
    title: 'Take care of your plan',
    links: [
      { href: '/forms', label: 'Forms & requests' },
      { href: '/plan-support', label: 'Plan support' },
      { href: '/renewals', label: 'Renewals' },
      { href: '/included', label: 'Service coverage' },
    ],
  },
  {
    title: 'Take the next step',
    links: [
      { href: '/services', label: 'Explore services' },
      { href: '/resources', label: 'Guides & resources' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/contact', label: 'Contact the team' },
    ],
  },
];

export const disclaimer =
  'The Tax Academy provides administrative support and education. Individual legal, tax, and other professional work is separately scoped with the appropriate provider. Your service agreement controls included coverage. The Tax Academy is not a law firm, CPA firm, investment adviser, broker-dealer, bank, custodian, trustee, or fiduciary, and does not hold or manage plan assets.';
