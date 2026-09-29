// Approved screenshots of the real member experience.
//
// The brief asks for actual product screenshots (never mock-ups). Put approved image
// files in public/images/screenshots/ and list them here. Sections that show
// screenshots stay hidden or fall back to text until an entry is added.
//
// Only use captions the screenshot actually supports.

export interface Screenshot {
  src: string; // e.g. '/images/screenshots/library-topics.webp'
  alt: string;
  caption: string;
}

// Homepage learning-library section (one image).
export const libraryScreenshot: Screenshot | null = null;
// Example:
// {
//   src: '/images/screenshots/library-topics.webp',
//   alt: 'Member learning library topic list',
//   caption: 'Practical learning, organized around the questions plan owners actually ask.',
// }

// Member Benefits page, "member experience" section (two or three images).
export const memberExperienceScreenshots: Screenshot[] = [
  // { src: '/images/screenshots/topics.webp', alt: '…', caption: 'Find related topics together.' },
  // { src: '/images/screenshots/lesson.webp', alt: '…', caption: 'Follow explanations of common plan processes.' },
  // { src: '/images/screenshots/resources.webp', alt: '…', caption: 'Return to practical resources when questions come up.' },
];
