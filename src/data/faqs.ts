export interface Faq {
  q: string;
  a: string[];
}

export const homeFaqs: Faq[] = [
  {
    q: 'Why does my plan need ongoing maintenance?',
    a: [
      'Retirement-plan requirements change, and applicable updates must be reflected in your plan documents. Ongoing maintenance helps address those changes instead of leaving you to rely indefinitely on the original paperwork.',
    ],
  },
  {
    q: 'Is annual renewal required?',
    a: [
      'Yes. An active, paid maintenance term is required to continue receiving The Tax Academy’s document maintenance, required-update service, administrative support, and member learning access.',
    ],
  },
  {
    q: 'Can I join if another provider prepared my plan?',
    a: [
      'Yes, you can request a provider review. Our team will explain whether we can support your existing plan and what the transition requires.',
    ],
  },
  {
    q: 'What makes the learning library different?',
    a: [
      'It combines attorney-reviewed material with nearly 30 years of our team’s retirement-plan experience. The lessons focus on questions plan owners actually encounter and make the fundamentals easier to understand.',
    ],
  },
];

export const switchFaqs: Faq[] = [
  {
    q: 'How much does switching cost?',
    a: [
      'The cost depends on your existing documents and any work needed before ongoing maintenance can begin. We explain the applicable fees before you proceed.',
    ],
  },
  {
    q: 'Will I receive the member learning library?',
    a: [
      'Yes. Learning access begins once your plan is accepted, the transition is completed, and your maintenance service becomes active.',
    ],
  },
  {
    q: 'Should I cancel my current service first?',
    a: ['Start with the review. Our team will explain the proposed transition before you change your existing arrangements.'],
  },
  {
    q: 'What happens if my documents are outdated?',
    a: [
      'Our team will identify the document work needed for the proposed transition and explain any additional services or fees. Historical issues may require separate review or corrective work.',
    ],
  },
];

export const renewalFaqs: Faq[] = [
  {
    q: 'Is annual renewal required?',
    a: [
      'Yes. Your Tax Academy maintenance service must remain active and paid to receive ongoing document maintenance, required updates, administrative support, and member learning access.',
      'A prepaid multi-year term satisfies the maintenance renewal requirement for that covered period.',
    ],
  },
  {
    q: 'What happens if I let my renewal lapse?',
    a: [
      'Your account must remain current for continued maintenance and update services. Allowing that support to lapse can leave required document work unaddressed. Missing applicable amendment deadlines can jeopardize your plan’s tax-qualified status.',
      'Contact our team promptly if your renewal is overdue.',
    ],
  },
  {
    q: 'What if I have missed previous renewals?',
    a: [
      'Contact our team so we can review your account, identify any outstanding document work, and explain what is required to bring your maintenance service current.',
    ],
  },
  {
    q: 'Does a multi-year renewal cover my annual maintenance?',
    a: [
      'Yes. It prepays the maintenance service for the selected period. You must still provide requested information and complete any required signatures or other annual actions.',
    ],
  },
  {
    q: 'What happens after I renew?',
    a: [
      'We process your renewal and review any additional services selected. Our team will contact you if information, signatures, or further documentation are needed.',
    ],
  },
  {
    q: 'Do I keep access to the learning library?',
    a: ['Yes. Member learning access continues throughout your active maintenance term.'],
  },
];
