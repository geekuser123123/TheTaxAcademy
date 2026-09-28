// D1 stores timestamps as UTC "YYYY-MM-DD HH:MM:SS" (datetime('now')) or ISO strings.
const parse = (s: string) => new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`);

export function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  return parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Phoenix' });
}

export function formatDateTime(s: string | null | undefined): string {
  if (!s) return '—';
  return parse(s).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Phoenix',
  });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;

export const str = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';
