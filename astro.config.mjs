// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Marketing pages are prerendered to static HTML at build time.
// Portal pages and API routes opt out with `export const prerender = false`
// and run on Cloudflare Workers with D1 (database) and R2 (documents).
export default defineConfig({
  site: 'https://thetaxacademy.com',
  output: 'static',
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
  // The portal uses its own D1-backed sessions (src/lib/auth.ts), so Astro's KV sessions are off.
  session: false,
  // The dev toolbar adds ~20 extra scripts to every page in `npm run dev`.
  devToolbar: { enabled: false },
  // Pages from the previous site structure, sent to their closest replacement.
  redirects: {
    '/forms': '/contact/',
    '/forms/thanks': '/contact/',
    '/forms/renewal': '/renewal-page/',
    '/forms/annual-reporting': '/contact/?topic=form-5500-ez',
    '/forms/plan-amendment': '/contact/?topic=plan-document-change',
    '/forms/business-update': '/contact/?topic=plan-document-change',
    '/forms/document-request': '/contact/?topic=plan-document-change',
    '/forms/participant-loan': '/contact/',
    '/forms/contact-team': '/contact/',
    '/forms/advanced-planning': '/contact/',
    '/renewals': '/renewal-page/',
    '/plan-support': '/member-benefits/',
    '/included': '/member-benefits/',
    '/resources': '/member-benefits/#learning-library',
    '/how-it-works': '/#how-it-works',
    '/services': '/#advanced-help',
    '/services/roth': '/#advanced-help',
    '/services/trusts': '/#advanced-help',
    '/services/transactions': '/#advanced-help',
    '/services/protection': '/#advanced-help',
    '/services/compliance': '/#advanced-help',
    '/privacy': '/privacy-policy/',
    '/service-information': '/terms-of-use/',
  },
  security: {
    checkOrigin: true,
  },
});
