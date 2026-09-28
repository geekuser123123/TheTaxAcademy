import { defineMiddleware } from 'astro:middleware';
import { getSessionUser, isTeam } from './lib/auth';

// Portal pages anyone can reach without signing in.
const PUBLIC_PORTAL = ['/portal/login', '/portal/setup', '/portal/set-password'];

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;

  // Marketing pages are prerendered at build time: no request, no session.
  if (context.isPrerendered) return next();

  const path = context.url.pathname.replace(/\/$/, '') || '/';
  if (!path.startsWith('/portal')) return next();

  context.locals.user = await getSessionUser(context.cookies);
  const user = context.locals.user;

  if (PUBLIC_PORTAL.some((p) => path === p)) return next();

  if (!user) {
    const nextUrl = encodeURIComponent(context.url.pathname + context.url.search);
    return context.redirect(`/portal/login?next=${nextUrl}`);
  }

  if (path.startsWith('/portal/admin') && !isTeam(user)) {
    return context.redirect('/portal');
  }

  const response = await next();
  // Portal pages contain private data: never cache them anywhere.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
