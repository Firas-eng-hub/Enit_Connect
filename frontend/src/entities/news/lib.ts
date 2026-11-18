import type { News } from './types';

/**
 * Uploaded images may be stored as absolute URLs or relative paths; always
 * serve them from the same origin (Vite proxy / nginx handle /uploads).
 */
export function resolveNewsImage(item: Pick<News, 'picture' | 'image'>): string | null {
  const source = item.picture || item.image || '';
  if (!source) return null;
  if (source.startsWith('http')) {
    try {
      return new URL(source).pathname;
    } catch {
      return source;
    }
  }
  return source.startsWith('/') ? source : `/${source}`;
}

export function newsDate(item: Pick<News, 'date' | 'createdAt'>): string | undefined {
  return item.date || item.createdAt;
}

/** Published news whose audience includes the given role (empty audience = everyone). */
export function isNewsVisibleTo(item: News, role: 'student' | 'company' | 'visitor'): boolean {
  const status = typeof item.status === 'string' ? item.status.toLowerCase().trim() : 'published';
  const audience = Array.isArray(item.audience)
    ? item.audience.map((value) => String(value).toLowerCase().trim())
    : typeof item.audience === 'string'
      ? item.audience.split(',').map((value) => value.toLowerCase().trim()).filter(Boolean)
      : [];
  return status !== 'draft' && (audience.length === 0 || audience.includes(role));
}
