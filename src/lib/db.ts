import { env } from 'cloudflare:workers';

export const db = () => env.DB;
export const documentsBucket = () => env.DOCUMENTS;

export const newId = () => crypto.randomUUID();

export interface UserRow {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  role: 'client' | 'staff' | 'admin';
  password_hash: string | null;
  is_active: number;
  created_at: string;
  last_login_at: string | null;
}

export interface DocumentRow {
  id: string;
  client_id: string;
  uploaded_by: string;
  uploader_name?: string;
  uploader_role?: string;
  title: string;
  category: string;
  r2_key: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface MessageRow {
  id: string;
  client_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface SubmissionRow {
  id: string;
  form_slug: string;
  name: string;
  email: string;
  phone: string | null;
  plan_name: string | null;
  payload: string;
  status: 'new' | 'in_progress' | 'done';
  client_id: string | null;
  created_at: string;
}

export const DOCUMENT_CATEGORIES = [
  'Plan documents',
  'Amendments',
  'Annual reporting',
  'Agreements & invoices',
  'From client',
  'General',
];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
