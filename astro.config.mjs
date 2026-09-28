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
  security: {
    checkOrigin: true,
  },
});
