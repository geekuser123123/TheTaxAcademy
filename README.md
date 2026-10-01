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

- **Online renewal** (`/renewal-page/`): members verify their email, choose a term and services, and pay by card. Payments run through the existing n8n workflow and Square (see "Online renewal" below).
- **Public forms** (provider review, contact): saved to the database, shown to the team in the portal, and optionally emailed to the team.
- **Member portal** (`/portal`, the Member Login destination): the member dashboard (plan status, renewal and expiration dates, plan details), the learning modules, admin forms, private documents, messages with the team, and the member's requests.
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

## Online renewal

The renewal checkout uses the same n8n workflow and Square account as the WordPress renewal page. It sends n8n the same payload fields, so the workflow runs unchanged.

1. The member enters their email. The site calls the n8n **lookup** webhook and shows a masked confirmation (name, last initial, business, phone ending) plus any account fee.
2. Square's card field (Web Payments SDK) turns the card into a one-time token in the browser. Card details never reach this site.
3. On **Complete Renewal**, the site looks the account up again, **recalculates the total from `src/data/renewal.ts`**, and posts the payload to the n8n **payment** webhook, which charges the token.
4. On success the member sees a receipt, the payment appears in the team workspace under Form requests, and the team gets an email if notifications are on. A declined card shows the error from n8n and leaves the form in place.
5. The member's portal account is updated: the renewal date becomes today and the expiration date moves forward by the term (from the current expiration date if it hasn't passed). If the member has no portal account yet, one is created and they're emailed a link to set their password (needs `RESEND_API_KEY` and `MAIL_FROM`; otherwise the team sends an invite link from the client's page). This replaces the WordPress step that created the member account, so **remove the "create WordPress user" step from the n8n workflow** when this site goes live.

Set the webhooks as Worker secrets (never in code):

```bash
npx wrangler secret put RENEWAL_LOOKUP_WEBHOOK_URL
npx wrangler secret put RENEWAL_PAYMENT_WEBHOOK_URL
npx wrangler secret put RENEWAL_WEBHOOK_SECRET   # optional, recommended
```

Until both URLs are set, the page loads normally but verification reports that online renewal is unavailable.

**Recommended once this site is live:** the WordPress page exposed the webhook URLs publicly. Create new webhook paths in n8n, store only the new ones here, and have the payment workflow reject requests whose `x-webhook-secret` header doesn't match `RENEWAL_WEBHOOK_SECRET`. Only this site can then trigger charges, always with server-calculated amounts.

For local testing, point `.dev.vars` at a test n8n workflow (see `.dev.vars.example`). Square's card field works on `localhost`.

## Moving clients from WordPress

Members of the WordPress member portal can sign in here with the same email and password. Their ACF fields (plan details, renewal and expiration dates, and so on) come along and fill in their dashboard.

1. **Print the export query** and run it in phpMyAdmin on the WordPress database (SQL tab). If your tables don't start with `wp_`, pass your prefix, e.g. `--prefix wpxy_`.

   ```bash
   node scripts/import-wordpress.mjs --print-query
   ```

2. **Export the result as CSV** (phpMyAdmin: *Export* under the results → CSV, tick *Put columns names in the first row*). Save it outside the project folder or anywhere Git ignores it. It contains password hashes and personal details: never commit it or email it.

3. **Turn it into SQL** and check the summary (clients found, team accounts skipped, duplicates, password formats):

   ```bash
   node scripts/import-wordpress.mjs path/to/export.csv --out import.sql
   ```

4. **Import it** (after `npm run db:migrate:remote`), then delete both files:

   ```bash
   npx wrangler d1 execute tax-academy --remote --file import.sql
   ```

How it works:

- WordPress administrators, editors, authors, and contributors are skipped; only member accounts come over. Existing team accounts here are never changed.
- Passwords are kept as the WordPress hash and checked the way WordPress checks them (both the pre-6.8 format and the 6.8+ bcrypt format). On each member's first sign-in the password is re-saved in this site's own format.
- Checking the WordPress 6.8+ format takes a few hundred milliseconds of CPU, more than the Workers Free plan allows per request. Use the **Workers Paid** plan (or members on that format will need a set-password link). It's a one-time cost per member.
- Re-running the import updates members in place, so you can run it once to test and again right before switching over. It overwrites plan details with the WordPress values, so don't re-run it after the team starts editing plan details here.
- Members whose password can't be brought over (or who forget it) get a set-password link from their page in the team workspace.

The team edits plan details on each client's page (Plan details). The dashboard's plan status follows the expiration date: Active until it passes, then Expired. Ticking Cancellation, or setting the status to "Cancelled", shows Cancelled.

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
- `modules.ts`: the member portal's learning modules, lessons, and admin forms (lesson content is being moved over page by page)
- `media.ts`: approved screenshots of the member experience (sections stay hidden or fall back to text until added)

## Before launch

Items marked `TODO(confirm)` in the code need the team's input:

- **Member import**: run the WordPress import (see "Moving clients from WordPress") and sign in as a test member; remove the "create WordPress user" step from the n8n payment workflow.
- **Expiration dates**: confirm that a renewal should extend from the current expiration date (early renewals) rather than from the payment date.
- **Renewal webhooks**: set the three `RENEWAL_*` secrets (see "Online renewal"), then do one real low-value test payment end to end.
- **Account fee**: the existing checkout adds a $45 "Reinstatement Fee" to every renewal that isn't behind (this was the $255 = $200 + $45 on the old page). Confirm the label and when it should apply in `src/data/renewal.ts`.
- **Pricing**: confirm every price in `src/data/renewal.ts` against the billing configuration.
- **Form 5500-EZ**: state whether the service includes submission or preparation only.
- **Termination fee** ($500) and the member-benefits inclusion list: confirm.
- **Screenshots**: add approved screenshots of the member learning library to `src/data/media.ts`.
- **Library topics**: confirm each category on Member Benefits has matching material.
- **Legal pages**: replace the draft Privacy Policy and Terms of Use with the approved text from the current site.
- **Contact details**: public email and mailing address in `src/data/site.ts`.
