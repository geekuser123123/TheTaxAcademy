// Optional email notifications to the team, sent through Resend's HTTP API.
// Does nothing unless RESEND_API_KEY, TEAM_EMAIL, and MAIL_FROM are configured.

import { env } from 'cloudflare:workers';

type MailEnv = { RESEND_API_KEY?: string; TEAM_EMAIL?: string; MAIL_FROM?: string };

export async function notifyTeam(subject: string, text: string): Promise<void> {
  const { RESEND_API_KEY, TEAM_EMAIL, MAIL_FROM } = env as unknown as MailEnv;
  if (!RESEND_API_KEY || !TEAM_EMAIL || !MAIL_FROM) return;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: TEAM_EMAIL.split(',').map((s) => s.trim()), subject, text }),
    });
    if (!res.ok) console.error('notifyTeam failed', res.status, await res.text());
  } catch (err) {
    console.error('notifyTeam error', err);
  }
}
