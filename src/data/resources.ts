// Video insights from Tim Berry. Add the YouTube video ID (the part after "v=")
// to publish a video; entries without an ID show as "coming soon".
export const videos = [
  { title: 'How to Change 401(k) Providers', presenter: 'Tim Berry', youtubeId: '' }, // TODO(confirm)
  { title: 'The Danger of IRA Rollovers', presenter: 'Tim Berry', youtubeId: '' }, // TODO(confirm)
  { title: 'How to Move Alternative Assets into a 401(k)', presenter: 'Tim Berry', youtubeId: '' }, // TODO(confirm)
];

// Link to the full video library (e.g. a YouTube channel). Hidden while empty.
export const videoLibraryUrl = '';

export const guides = [
  {
    title: 'Keeping your plan current',
    text: 'When amendments and restatements are required, and what to do when your business changes.',
    href: '/plan-support',
  },
  {
    title: 'Annual reporting basics',
    text: 'Form 5500-EZ: when a filing is required and what information to gather.',
    href: '/forms/annual-reporting',
  },
  {
    title: 'Participant loans',
    text: 'How plan loans work, what documents are needed, and how repayments are handled.',
    href: '/forms/participant-loan',
  },
  {
    title: 'Alternative investments',
    text: 'Real estate, private lending, and other assets inside a self-directed plan.',
    href: '/services/transactions',
  },
];
