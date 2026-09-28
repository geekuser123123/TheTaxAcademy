// Data access shared by the client portal and the team workspace.

import {
  db,
  documentsBucket,
  newId,
  DOCUMENT_CATEGORIES,
  MAX_UPLOAD_BYTES,
  type DocumentRow,
  type MessageRow,
  type SubmissionRow,
} from './db';
import type { SessionUser } from './auth';
import { str } from './format';

export async function listDocuments(clientId: string): Promise<DocumentRow[]> {
  const { results } = await db()
    .prepare(
      `SELECT d.*, u.name AS uploader_name, u.role AS uploader_role
         FROM documents d JOIN users u ON u.id = d.uploaded_by
        WHERE d.client_id = ? ORDER BY d.created_at DESC`,
    )
    .bind(clientId)
    .all<DocumentRow>();
  return results;
}

export async function listMessages(clientId: string): Promise<MessageRow[]> {
  const { results } = await db()
    .prepare(
      `SELECT m.*, u.name AS author_name, u.role AS author_role
         FROM messages m JOIN users u ON u.id = m.author_id
        WHERE m.client_id = ? ORDER BY m.created_at ASC LIMIT 500`,
    )
    .bind(clientId)
    .all<MessageRow>();
  return results;
}

/** Marks messages written by the other side as read. */
export async function markRead(clientId: string, viewer: SessionUser): Promise<void> {
  const fromClient = viewer.role !== 'client';
  await db()
    .prepare(
      `UPDATE messages SET read_at = datetime('now')
        WHERE client_id = ? AND read_at IS NULL
          AND author_id ${fromClient ? '=' : '!='} ?`,
    )
    .bind(clientId, clientId)
    .run();
}

export async function listClientSubmissions(clientId: string, email: string): Promise<SubmissionRow[]> {
  const { results } = await db()
    .prepare(
      `SELECT * FROM submissions WHERE client_id = ? OR email = ? COLLATE NOCASE
        ORDER BY created_at DESC LIMIT 100`,
    )
    .bind(clientId, email)
    .all<SubmissionRow>();
  return results;
}

export async function postMessage(clientId: string, author: SessionUser, body: string): Promise<string | null> {
  const text = body.trim().slice(0, 5000);
  if (!text) return 'Write a message first.';
  await db()
    .prepare('INSERT INTO messages (id, client_id, author_id, body) VALUES (?, ?, ?, ?)')
    .bind(newId(), clientId, author.id, text)
    .run();
  return null;
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, '_').replace(/\s+/g, ' ').trim();
  return cleaned.slice(-120) || 'document';
}

/** Validates and stores an uploaded file. Returns an error message, or null on success. */
export async function uploadDocument(
  data: FormData,
  clientId: string,
  uploader: SessionUser,
): Promise<string | null> {
  const file = data.get('file');
  if (!(file instanceof File) || file.size === 0) return 'Choose a file to upload.';
  if (file.size > MAX_UPLOAD_BYTES) return 'Files must be 25 MB or smaller.';

  const fileName = safeFileName(file.name);
  const title = str(data.get('title'), 200) || fileName.replace(/\.[^.]+$/, '');
  const requested = str(data.get('category'), 60);
  const category =
    uploader.role === 'client' ? 'From client' : DOCUMENT_CATEGORIES.includes(requested) ? requested : 'General';

  const id = newId();
  const key = `clients/${clientId}/${id}/${fileName}`;
  const contentType = file.type || 'application/octet-stream';

  await documentsBucket().put(key, file.stream(), {
    httpMetadata: { contentType },
    customMetadata: { clientId, uploadedBy: uploader.id },
  });
  try {
    await db()
      .prepare(
        `INSERT INTO documents (id, client_id, uploaded_by, title, category, r2_key, file_name, content_type, size_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, clientId, uploader.id, title, category, key, fileName, contentType, file.size)
      .run();
  } catch (err) {
    await documentsBucket().delete(key);
    throw err;
  }
  return null;
}

export async function deleteDocument(id: string): Promise<void> {
  const doc = await db().prepare('SELECT r2_key FROM documents WHERE id = ?').bind(id).first<{ r2_key: string }>();
  if (!doc) return;
  await documentsBucket().delete(doc.r2_key);
  await db().prepare('DELETE FROM documents WHERE id = ?').bind(id).run();
}
