#!/usr/bin/env node
// Moves member accounts from the WordPress member portal into the portal database.
// See "Moving clients from WordPress" in README.md for the full steps.
//
//   node scripts/import-wordpress.mjs --print-query [--prefix wp_]
//       Prints the MySQL query to run in phpMyAdmin. Export its result as CSV
//       (with column names in the first row).
//
//   node scripts/import-wordpress.mjs <export.csv> [--out import.sql] [--prefix wp_]
//       Turns that CSV into SQL for Cloudflare D1:
//       npx wrangler d1 execute tax-academy --remote --file import.sql
//
// Passwords stay as the WordPress hash (stored as "wp:<hash>"); the portal checks it the
// way WordPress does and replaces it with its own hash on each client's first sign-in.
// Team accounts in the portal are never changed. Re-running updates clients in place.
//
// The export contains password hashes and personal details: keep it off GitHub, out of
// email, and delete it (and import.sql) once the import is done.

import fs from 'node:fs';
import crypto from 'node:crypto';

// ACF user fields -> client_profiles columns. Keep in sync with src/lib/profile.ts.
const FIELDS = {
  first_name: 'text',
  last_name: 'text',
  participant_name: 'text',
  date_of_birth: 'text',
  email_address: 'text',
  phone_number: 'text',
  street_address: 'text',
  city_state_zip: 'text',
  business_name: 'text',
  company_name: 'text',
  entity_type: 'text',
  business_ein: 'text',
  business_address: { acf: 'business_ad' },
  ownership_of_other_business: 'text',
  location_city: 'text',
  location_state: 'text',
  plan_sponsor: 'text',
  plan_trustee: 'text',
  trustee_name: 'text',
  co_trustee: 'text',
  spouse_name: 'text',
  spouse_participant: 'text',
  spouse_phone_number: 'text',
  spouse_email: 'text',
  plan_status: 'text',
  renewal_type: 'text',
  renewal_date: 'date',
  expiry_date: 'date',
  payment_status: 'text',
  course_access_status: 'text',
  total_paid: 'text',
  transaction_id: 'text',
  zoho_client_id: 'text',
  addon_5500ez: 'bool',
  addon_joinder: 'bool',
  addon_amendment: 'bool',
  cancellation: 'bool',
  form_5500ez_submitted: { acf: '5500ez_submitted', kind: 'bool' },
};
const fieldList = Object.entries(FIELDS).map(([column, spec]) => ({
  column,
  acf: (typeof spec === 'object' && spec.acf) || column,
  kind: typeof spec === 'string' ? spec : spec.kind || 'text',
}));

// WordPress roles that are staff, not clients. Their accounts are skipped.
const TEAM_ROLES = ['administrator', 'editor', 'author', 'contributor', 'shop_manager'];

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const prefix = opt('--prefix', 'wp_');
if (!/^\w+$/.test(prefix)) fail('The table prefix may only contain letters, numbers, and underscores.');

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (args.includes('--print-query')) {
  const cols = fieldList
    .map((f) => `  MAX(CASE WHEN m.meta_key = '${f.acf}' THEN m.meta_value END) AS \`${f.column}\``)
    .join(',\n');
  console.log(`SELECT
  u.ID AS wp_user_id,
  u.user_email,
  u.user_pass,
  u.display_name,
  u.user_registered,
  MAX(CASE WHEN m.meta_key = '${prefix}capabilities' THEN m.meta_value END) AS capabilities,
${cols}
FROM ${prefix}users u
LEFT JOIN ${prefix}usermeta m ON m.user_id = u.ID
GROUP BY u.ID
ORDER BY u.ID;`);
  process.exit(0);
}

const input = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!input) fail('Pass the CSV export, e.g. node scripts/import-wordpress.mjs export.csv --out import.sql');
const out = opt('--out', 'import.sql');

// ---------- CSV ----------

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  // Comma-separated, or semicolon-separated ("CSV for MS Excel"): decide from the header.
  const firstLine = text.slice(0, text.search(/\r?\n/) >>> 0);
  const sep = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.some((v) => v !== '')) rows.push(row);
  }
  return rows;
}

const rows = parseCsv(fs.readFileSync(input, 'utf8'));
const header = rows.shift()?.map((h) => h.trim());
if (!header?.includes('user_email') || !header.includes('user_pass')) {
  fail('The CSV needs column names in the first row (tick "Put columns names in the first row" in phpMyAdmin).');
}
const records = rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));

// ---------- Values ----------

const clean = (v) => {
  const s = String(v ?? '').replace(/\0/g, '').trim();
  return s === 'NULL' ? '' : s;
};
const sql = (v) => (v === null || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

function toDate(v) {
  const s = clean(v);
  if (!s) return null;
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/) || s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const toBool = (v) => (['1', 'true', 'yes', 'on'].includes(clean(v).toLowerCase()) ? 1 : 0);

function hashKind(hash) {
  if (hash.startsWith('$wp$')) return 'WordPress 6.8+ (bcrypt)';
  if (/^\$2[aby]\$/.test(hash)) return 'bcrypt';
  if (hash.startsWith('$P$') || hash.startsWith('$H$')) return 'phpass (WordPress before 6.8)';
  if (/^[a-f0-9]{32}$/i.test(hash)) return 'MD5 (very old)';
  return 'unrecognized';
}

// ---------- Build ----------

const report = { clients: 0, skippedTeam: 0, skippedNoEmail: 0, duplicates: [], hashes: {}, roles: {} };
const seen = new Set();
const statements = [
  '-- Generated by scripts/import-wordpress.mjs. Contains password hashes: delete after importing.',
];

for (const r of records) {
  const caps = clean(r.capabilities);
  const roles = [...caps.matchAll(/"([a-z0-9_]+)";b:1/g)].map((m) => m[1]);
  for (const role of roles.length ? roles : ['(none)']) report.roles[role] = (report.roles[role] ?? 0) + 1;
  if (roles.some((role) => TEAM_ROLES.includes(role))) {
    report.skippedTeam++;
    continue;
  }

  const email = clean(r.user_email).toLowerCase();
  if (!email || !email.includes('@')) {
    report.skippedNoEmail++;
    continue;
  }
  if (seen.has(email)) {
    report.duplicates.push(email);
    continue;
  }
  seen.add(email);

  const values = {};
  for (const f of fieldList) {
    const raw = r[f.column];
    values[f.column] = f.kind === 'bool' ? toBool(raw) : f.kind === 'date' ? toDate(raw) : clean(raw) || null;
  }

  const name =
    [values.first_name, values.last_name].filter(Boolean).join(' ') || clean(r.display_name) || email.split('@')[0];
  const hash = clean(r.user_pass);
  const kind = hash ? hashKind(hash) : 'none';
  report.hashes[kind] = (report.hashes[kind] ?? 0) + 1;
  const passwordHash = hash && kind !== 'unrecognized' ? `wp:${hash}` : null;
  const created = clean(r.user_registered).match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)?.[0] ?? null;

  statements.push(
    `INSERT INTO users (id, email, name, company, phone, role, password_hash, created_at)
VALUES (${sql(crypto.randomUUID())}, ${sql(email)}, ${sql(name)}, ${sql(values.business_name ?? values.company_name)}, ${sql(values.phone_number)}, 'client', ${sql(passwordHash)}, ${created ? sql(created) : "datetime('now')"})
ON CONFLICT(email) DO UPDATE SET name = excluded.name, company = excluded.company, phone = excluded.phone,
  password_hash = CASE WHEN users.password_hash IS NULL OR users.password_hash LIKE 'wp:%' THEN excluded.password_hash ELSE users.password_hash END
WHERE users.role = 'client';`,
  );

  const cols = fieldList.map((f) => f.column);
  statements.push(
    `INSERT INTO client_profiles (user_id, wp_user_id, ${cols.join(', ')})
SELECT id, ${Number(clean(r.wp_user_id)) || 'NULL'}, ${cols.map((c) => sql(values[c])).join(', ')}
FROM users WHERE email = ${sql(email)} AND role = 'client'
ON CONFLICT(user_id) DO UPDATE SET wp_user_id = excluded.wp_user_id, ${cols.map((c) => `${c} = excluded.${c}`).join(', ')}, updated_at = datetime('now');`,
  );
  // Link earlier public requests and renewal payments to the account.
  statements.push(
    `UPDATE submissions SET client_id = (SELECT id FROM users WHERE email = ${sql(email)} AND role = 'client') WHERE email = ${sql(email)} AND client_id IS NULL;`,
  );
  report.clients++;
}

fs.writeFileSync(out, statements.join('\n\n') + '\n');

console.log(`Wrote ${out}`);
console.log(`  Clients to import:        ${report.clients}`);
console.log(`  Skipped (team roles):     ${report.skippedTeam}`);
console.log(`  Skipped (no email):       ${report.skippedNoEmail}`);
console.log(`  Skipped (duplicate email): ${report.duplicates.length}${report.duplicates.length ? ` (${report.duplicates.slice(0, 10).join(', ')}${report.duplicates.length > 10 ? ', …' : ''})` : ''}`);
console.log('  WordPress roles found:    ' + Object.entries(report.roles).map(([k, v]) => `${k} ${v}`).join(', '));
console.log('  Password formats:         ' + Object.entries(report.hashes).map(([k, v]) => `${k} ${v}`).join(', '));
if (report.hashes.unrecognized || report.hashes.none) {
  console.log('  Clients without a usable password will need a set-password link from the team workspace.');
}
console.log(`\nNext: npx wrangler d1 execute tax-academy --remote --file ${out}`);
