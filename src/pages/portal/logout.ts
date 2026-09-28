import type { APIRoute } from 'astro';
import { destroySession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await destroySession(cookies);
  return redirect('/portal/login?notice=signed-out', 303);
};

export const GET: APIRoute = ({ redirect }) => redirect('/portal', 303);
