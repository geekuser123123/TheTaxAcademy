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

/** Sends one email through Resend. Returns false (and logs) if email isn't configured or fails. */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const { RESEND_API_KEY, MAIL_FROM } = env as unknown as MailEnv;
  if (!RESEND_API_KEY || !MAIL_FROM) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text }),
    });
    if (!res.ok) console.error('sendEmail failed', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('sendEmail error', err);
    return false;
  }
}
