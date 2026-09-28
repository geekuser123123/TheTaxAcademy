import type { APIRoute } from 'astro';
import { db, documentsBucket, type DocumentRow } from '../../../lib/db';
import { isTeam } from '../../../lib/auth';

export const prerender = false;

// Streams a document from R2 after checking the viewer may see it.
export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return new Response('Not found', { status: 404 });

  const doc = await db().prepare('SELECT * FROM documents WHERE id = ?').bind(params.id).first<DocumentRow>();
  if (!doc || (!isTeam(user) && doc.client_id !== user.id)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await documentsBucket().get(doc.r2_key);
  if (!object) return new Response('Not found', { status: 404 });

  const inline = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain'].includes(doc.content_type);
  const encoded = encodeURIComponent(doc.file_name);
  return new Response(object.body, {
    headers: {
      'Content-Type': doc.content_type,
      'Content-Length': String(object.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encoded}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
};
