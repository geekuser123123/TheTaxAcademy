import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { db, newId } from '../../lib/db';
import { getPublicForm, type Field } from '../../data/forms';
import { money, renewalServices, renewalTerms, summarize } from '../../data/renewal';
import { isEmail, str } from '../../lib/format';
import { notifyTeam } from '../../lib/notify';

export const prerender = false;

const COLUMNS = ['name', 'email', 'phone', 'plan_name'] as const;

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = (env as unknown as { TURNSTILE_SECRET_KEY?: string }).TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile not configured
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

/** Returns the cleaned value, or an error code. */
function readField(field: Field, data: FormData): { value: string } | { error: string } {
  const value = str(data.get(field.name), field.type === 'textarea' ? 5000 : 500);
  if (!value) return field.required ? { error: 'missing' } : { value: '' };
  if (field.type === 'email' && !isEmail(value)) return { error: 'email' };
  if (field.type === 'select' && !field.options.some((o) => o.value === value)) return { error: 'missing' };
  return { value };
}

export const POST: APIRoute = async ({ request, redirect, clientAddress }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return redirect('/contact/?error=server', 303);
  }

  const form = getPublicForm(str(data.get('form_slug'), 80));
  if (!form) return redirect('/contact/', 303);

  const back = (code: string) => {
    const ref = request.headers.get('referer');
    const sameOrigin = ref && new URL(ref).origin === new URL(request.url).origin;
    const url = new URL(sameOrigin ? ref : '/contact/', request.url);
    url.searchParams.set('error', code);
    url.hash = form.anchor;
    return redirect(url.pathname + url.search + url.hash, 303);
  };

  // Honeypot: bots fill every field. Pretend it worked.
  if (str(data.get('website'))) return redirect(form.successPath, 303);

  const columns: Record<string, string> = {};
  const payload: Record<string, string> = {};
  for (const field of form.fields) {
    const result = readField(field, data);
    if ('error' in result) return back(result.error);
    if (!result.value) continue;
    if ((COLUMNS as readonly string[]).includes(field.name)) {
      columns[field.name] = result.value;
    } else {
      payload[field.label] =
        field.type === 'select' ? (field.options.find((o) => o.value === result.value)?.label ?? result.value) : result.value;
    }
  }

  let successPath = form.successPath;
  if (form.slug === 'renewal') {
    const termId = str(data.get('term'), 10);
    if (!renewalTerms.some((t) => t.id === termId)) return back('term');
    const serviceIds = data
      .getAll('services')
      .map((v) => str(v, 40))
      .filter((id) => renewalServices.some((s) => s.id === id));
    // Recompute from the price list; never trust a total sent by the browser.
    const { term, services, total } = summarize(termId, serviceIds);
    Object.assign(payload, {
      'Maintenance term': `${term!.label} — ${money(term!.price)}`,
      'Additional services': services.length ? services.map((s) => `${s.label} — ${money(s.price)}`).join('\n') : 'None',
      'Total selected': money(total),
    });
    const params = new URLSearchParams({ term: termId });
    if (serviceIds.length) params.set('services', serviceIds.join(','));
    successPath = `${form.successPath}?${params}`;
  }

  if (!(await verifyTurnstile(str(data.get('cf-turnstile-response'), 4096), clientAddress ?? null))) {
    return back('captcha');
  }

  try {
    // Link to an existing portal client with the same email, if any.
    const client = await db()
      .prepare("SELECT id FROM users WHERE email = ? AND role = 'client'")
      .bind(columns.email)
      .first<{ id: string }>();
    await db()
      .prepare(
        `INSERT INTO submissions (id, form_slug, name, email, phone, plan_name, payload, client_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId(),
        form.slug,
        columns.name,
        columns.email,
        columns.phone ?? null,
        columns.plan_name ?? null,
        JSON.stringify(payload),
        client?.id ?? null,
      )
      .run();
  } catch (err) {
    console.error('submission insert failed', err);
    return back('server');
  }

  const lines = [
    form.title,
    '',
    `Name: ${columns.name}`,
    `Email: ${columns.email}`,
    columns.phone && `Phone: ${columns.phone}`,
    columns.plan_name && `Business / plan: ${columns.plan_name}`,
    '',
    ...Object.entries(payload).map(([k, v]) => `${k}: ${v}`),
    '',
    `Review in the portal: ${new URL('/portal/admin/submissions', request.url)}`,
  ].filter((l) => l !== undefined && l !== '');
  await notifyTeam(`New ${form.title.toLowerCase()}: ${columns.name}`, lines.join('\n'));

  return redirect(successPath, 303);
};
