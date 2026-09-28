import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { db, newId } from '../../lib/db';
import { getForm } from '../../data/forms';
import { isEmail, str } from '../../lib/format';
import { notifyTeam } from '../../lib/notify';

export const prerender = false;

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

export const POST: APIRoute = async ({ request, redirect, clientAddress }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return redirect('/forms?error=server', 303);
  }

  const form = getForm(str(data.get('form_slug'), 80));
  if (!form) return redirect('/forms', 303);

  const back = (code: string) => {
    const ref = request.headers.get('referer');
    const url = new URL(ref && new URL(ref).origin === new URL(request.url).origin ? ref : `/forms/${form.slug}`, request.url);
    url.searchParams.set('error', code);
    url.hash = 'request';
    return redirect(url.pathname + url.search + url.hash, 303);
  };

  // Honeypot: bots fill every field. Pretend it worked.
  if (str(data.get('website'))) return redirect('/forms/thanks', 303);

  const name = str(data.get('name'), 120);
  const email = str(data.get('email'), 200);
  const phone = str(data.get('phone'), 40);
  const planName = str(data.get('plan_name'), 200);

  if (!name || !email) return back('missing');
  if (!isEmail(email)) return back('email');

  const payload: Record<string, string> = {};
  for (const field of form.fields) {
    const value = str(data.get(field.name), field.type === 'textarea' ? 5000 : 500);
    if (field.required && !value) return back('missing');
    if (value) payload[field.label] = value;
  }

  if (!(await verifyTurnstile(str(data.get('cf-turnstile-response'), 4096), clientAddress ?? null))) {
    return back('captcha');
  }

  try {
    // Link to an existing portal client with the same email, if any.
    const client = await db()
      .prepare("SELECT id FROM users WHERE email = ? AND role = 'client'")
      .bind(email)
      .first<{ id: string }>();
    await db()
      .prepare(
        `INSERT INTO submissions (id, form_slug, name, email, phone, plan_name, payload, client_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(newId(), form.slug, name, email, phone || null, planName || null, JSON.stringify(payload), client?.id ?? null)
      .run();
  } catch (err) {
    console.error('submission insert failed', err);
    return back('server');
  }

  const lines = [
    `${form.title}`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone && `Phone: ${phone}`,
    planName && `Plan / business: ${planName}`,
    '',
    ...Object.entries(payload).map(([k, v]) => `${k}: ${v}`),
    '',
    `Review in the portal: ${new URL('/portal/admin/submissions', request.url)}`,
  ].filter((l) => l !== '');
  await notifyTeam(`New request: ${form.title} — ${name}`, lines.join('\n'));

  return redirect(`/forms/thanks?form=${form.slug}`, 303);
};
