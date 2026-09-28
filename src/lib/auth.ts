// Password hashing, sessions, and one-time links for the client portal.
// Uses only Web Crypto, so it runs natively on Cloudflare Workers.

import type { AstroCookies } from 'astro';
import { db, newId } from './db';

export type Role = 'client' | 'staff' | 'admin';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  company: string | null;
}

export const SESSION_COOKIE = 'tta_session';
const SESSION_DAYS = 14;
// Workers cap PBKDF2 at 100,000 iterations.
const PBKDF2_ITERATIONS = 100_000;

const enc = new TextEncoder();

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function toB64Url(bytes: Uint8Array): string {
  return toB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function randomToken(bytes = 32): string {
  return toB64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iter, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iter || !salt || !hash) return false;
  const actual = await pbkdf2(password, fromB64(salt), Number(iter));
  return timingSafeEqual(actual, fromB64(hash));
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'Use at least 10 characters.';
  if (password.length > 200) return 'That password is too long.';
  return null;
}

// ---------- Sessions ----------

export async function createSession(cookies: AstroCookies, userId: string): Promise<void> {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const now = new Date().toISOString();
  // Housekeeping: sign-ins are rare enough that pruning here keeps the tables small.
  await db().batch([
    db().prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    db().prepare('DELETE FROM auth_tokens WHERE expires_at < ? OR used_at IS NOT NULL').bind(now),
  ]);
  await db()
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, expires.toISOString())
    .run();
  await db().prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").bind(userId).run();
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires,
  });
}

export async function getSessionUser(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.company
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ? AND u.is_active = 1`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<SessionUser>();
  return row ?? null;
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await db().prepare('DELETE FROM sessions WHERE id = ?').bind(await sha256(token)).run();
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function destroyAllSessions(userId: string): Promise<void> {
  await db().prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

// ---------- One-time links (invites & resets) ----------

export async function createAuthLink(
  origin: string,
  userId: string,
  purpose: 'invite' | 'reset',
): Promise<string> {
  const token = randomToken();
  const hours = purpose === 'invite' ? 24 * 7 : 24;
  const expires = new Date(Date.now() + hours * 3_600_000).toISOString();
  // Only the newest link of each kind stays valid.
  await db()
    .prepare('DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ? AND used_at IS NULL')
    .bind(userId, purpose)
    .run();
  await db()
    .prepare('INSERT INTO auth_tokens (id, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, purpose, expires)
    .run();
  return `${origin}/portal/set-password?token=${token}`;
}

export async function findAuthLink(token: string) {
  return db()
    .prepare(
      `SELECT t.id, t.user_id, t.purpose, u.name, u.email
         FROM auth_tokens t JOIN users u ON u.id = t.user_id
        WHERE t.id = ? AND t.used_at IS NULL AND t.expires_at > ? AND u.is_active = 1`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<{ id: string; user_id: string; purpose: 'invite' | 'reset'; name: string; email: string }>();
}

export async function markAuthLinkUsed(id: string): Promise<void> {
  await db().prepare("UPDATE auth_tokens SET used_at = datetime('now') WHERE id = ?").bind(id).run();
}

export const isTeam = (user: SessionUser | null) => user?.role === 'staff' || user?.role === 'admin';

export { newId };
