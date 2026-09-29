// Single source for business details shown across the site.
// Values marked TODO(confirm) need to be verified by the team before launch.

export const site = {
  name: 'The Tax Academy',
  legalName: 'The Tax Academy, LLC',
  tagline: 'Self-directed 401(k) document maintenance and support',
  description:
    'Ongoing document maintenance, required updates, administrative support, and attorney-reviewed education for self-directed 401(k) owners.',
  phone: '(480) 466-0401',
  phoneHref: 'tel:+14804660401',
  email: '', // TODO(confirm): public contact email (hidden while empty)
  address: {
    line1: '2473 S Higley Rd, Ste. 104-117', // TODO(confirm)
    line2: 'Gilbert, AZ 85295', // TODO(confirm)
  },
  // Existing Member Login destination. Do not change in this phase.
  memberLoginUrl: '/portal',
  iraIdeasUrl: 'https://iraideas.com/',
};

export const experience = 'Our attorney and our team bring nearly 30 years of retirement-plan experience.';

export const renewalRequirement =
  'Annual renewal is required to keep your Tax Academy document maintenance, required-update service, administrative support, and member learning access active.';

export const mainNav = [
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/member-benefits/', label: 'Member Benefits' },
  { href: '/switch-providers/', label: 'Switch Providers' },
];

export const footerNav = [
  { href: '/member-benefits/', label: 'Member Benefits' },
  { href: '/switch-providers/', label: 'Switch Providers' },
  { href: '/renewal-page/', label: 'Renew My Plan' },
  { href: '/contact/', label: 'Contact' },
  { href: site.memberLoginUrl, label: 'Member Login' },
  { href: '/privacy-policy/', label: 'Privacy Policy' },
  { href: '/terms-of-use/', label: 'Terms of Use' },
];

export const footerDescription =
  'The Tax Academy provides ongoing retirement-plan document maintenance, administrative support, and attorney-reviewed educational resources for supported self-directed retirement plans.';

export const disclaimer =
  'The Tax Academy provides document maintenance, administrative support, and education. It is not a law firm, CPA firm, investment adviser, broker-dealer, bank, custodian, trustee, or fiduciary, and does not hold or manage retirement assets. Educational materials explain general processes and do not create an attorney-client relationship. Your plan documents and individual circumstances determine what applies to a particular situation.';
