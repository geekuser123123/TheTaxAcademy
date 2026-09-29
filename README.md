# The Tax Academy

Website and client portal for The Tax Academy, LLC.

- **Public site** (prerendered to static HTML), positioned around two actions: renewing plan maintenance and switching providers.

  | Page | URL |
  | --- | --- |
  | Home | `/` (How It Works is `/#how-it-works`) |
  | Member Benefits | `/member-benefits/` |
  | Switch Providers | `/switch-providers/` (form at `#request-review`) |
  | Renew My Plan | `/renewal-page/` |
  | Contact | `/contact/` (`?topic=` preselects the reason) |
  | Privacy Policy / Terms of Use | `/privacy-policy/`, `/terms-of-use/` |

- **Public forms** (provider review, contact, renewal): saved to the database, shown to the team in the portal, and optionally emailed to the team.
- **Member portal** (`/portal`, the Member Login destination): private documents, messages with the team, and the member's requests.
- **Team workspace** (`/portal/admin`): add members and send invite links, share and receive documents, reply to messages, and work through form requests.

Old URLs from the previous structure (`/forms/*`, `/services/*`, `/renewals`, `/privacy`, …) permanently redirect to their replacements; see `redirects` in `astro.config.mjs`.

## Stack

| Piece | What it does |
| --- | --- |
| [Astro](https://astro.build) | Pages and components. Static by default; portal pages render on demand. |
| [Cloudflare Workers](https://developers.cloudflare.com/workers/) | Hosts everything: static assets plus the portal and API. |
| [Cloudflare D1](https://developers.cloudflare.com/d1/) | SQLite database: users, sessions, messages, form submissions, document records. |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Private storage for client documents. Never public; files are streamed only after a permission check. |
| GitHub Actions | Type-checks and builds every PR; deploys `main` to Cloudflare. |

No third-party auth or database services are required. Passwords are hashed with PBKDF2 (Web Crypto), sessions are stored in D1 behind an `HttpOnly`, `Secure` cookie, and cross-site form posts are rejected.

## Project layout

```
src/
  data/          Contact details, nav, forms, renewal prices, FAQs, screenshots  ← edit here
  pages/         Marketing pages (static) and portal pages (server-rendered)
    api/submit.ts        Public form handler
    portal/              Client portal
    portal/admin/        Team workspace
  components/    Header, footer, form, and portal UI pieces
  lib/           Auth, database helpers, notifications
  styles/        global.css (site design tokens), portal.css
  middleware.ts  Loads the signed-in user and protects /portal
migrations/      D1 schema (applied automatically on deploy)
public/images/   Logo and seal
```

## Local development

```bash
npm install
npm run db:migrate:local     # create the local D1 database
npm run dev                  # http://localhost:4321
```

`npm run dev` uses local copies of D1 and R2, so nothing touches production. To test the production build locally, run `npm run build && npm run preview`.

The first visit to `/portal` opens a one-time **setup** page to create the first admin account. It disappears once an admin exists.

## First-time Cloudflare setup

1. **Create the database and bucket** (logged in with `npx wrangler login`):

   ```bash
   npx wrangler d1 create tax-academy
   npx wrangler r2 bucket create tax-academy-documents
   ```

   Paste the `database_id` printed by the first command into `wrangler.jsonc`.

2. **Add GitHub secrets** (repo → Settings → Secrets and variables → Actions):

   - `CLOUDFLARE_API_TOKEN`: create at Cloudflare dashboard → My Profile → API Tokens, using the **Edit Cloudflare Workers** template plus **D1: Edit** permission.
   - `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview page.

   Also create a GitHub environment named `production` (Settings → Environments). You can add required reviewers there if you want deploys approved.

3. **Push to `main`.** The Deploy workflow applies migrations and deploys the Worker.

4. **Connect the domain**: Cloudflare dashboard → Workers & Pages → `the-tax-academy` → Settings → Domains & Routes → add your domain. Update `site` in `astro.config.mjs` to match.

5. **Create the first admin**: visit `https://<your-domain>/portal` and complete the setup page right away.

## Optional features

**Email notifications** for new form requests, client messages, and client uploads (via [Resend](https://resend.com)):

```bash
npx wrangler secret put RESEND_API_KEY
```

Then set `TEAM_EMAIL` (comma-separated) and `MAIL_FROM` (a verified sender, e.g. `The Tax Academy <portal@yourdomain.com>`) in `wrangler.jsonc` under `vars`.

**Spam protection** with [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/): create a widget, then

- add the site key as a GitHub repository **variable** `PUBLIC_TURNSTILE_SITE_KEY`
- add the secret key with `npx wrangler secret put TURNSTILE_SECRET_KEY`

Public forms already use a hidden honeypot field, so this is only needed if spam gets through.

**Rate limiting**: in the Cloudflare dashboard, add a WAF rate-limiting rule for `POST /portal/login` and `POST /api/submit` (e.g. 10 requests per minute per IP).

## How the portal works

- **Adding a client**: Team workspace → *Add a client* → copy the invite link and send it by email or text. The link works once and expires after 7 days. Any earlier form requests from that email are linked to the new client automatically.
- **Forgotten passwords**: open the client → *Create reset link* (valid 24 hours). There's no self-service reset email, so a stranger can't trigger one.
- **Team members**: admins can add team members or other admins from the same form (Account type), create password links for them, and deactivate them.
- **Documents**: the team uploads with a category; clients can upload too (tagged *From client*). Files up to 25 MB.
- **Deactivating** a client signs them out immediately and blocks sign-in; their records stay.

## Editing content

Page copy lives in the page files under `src/pages/`. Shared data lives in `src/data/`:

- `site.ts`: phone, email, address, navigation, footer text, legal fine print, Member Login destination
- `renewal.ts`: renewal terms, additional services, and their prices (the server recalculates totals from this file)
- `forms.ts`: provider review, contact, and renewal form fields; contact reasons and `?topic=` values
- `faqs.ts`: homepage, switching, and renewal questions
- `media.ts`: approved screenshots of the member experience (sections stay hidden or fall back to text until added)

## Before launch

Items marked `TODO(confirm)` in the code need the team's input:

- **Checkout**: this site does not take payments. "Complete Renewal" sends the team an itemized renewal request (term, services, total), and the page says payment instructions will follow. Connect the approved payment flow before launch, including the success, pending, and failed payment states.
- **Pricing**: confirm every price in `src/data/renewal.ts` against the billing configuration. The old renewal page also showed $255 in some total fields, which needs reconciling.
- **Form 5500-EZ**: state whether the service includes submission or preparation only.
- **Termination fee** ($500) and the member-benefits inclusion list: confirm.
- **Screenshots**: add approved screenshots of the member learning library to `src/data/media.ts`.
- **Library topics**: confirm each category on Member Benefits has matching material.
- **Legal pages**: replace the draft Privacy Policy and Terms of Use with the approved text from the current site.
- **Contact details**: public email and mailing address in `src/data/site.ts`.
