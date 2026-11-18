import { config } from '@/app/config/env';

const LOCAL_ORIGINS = [
  'http://localhost',
  'http://127.0.0.1',
  'http://0.0.0.0',
  'https://localhost',
  'https://127.0.0.1',
];

/**
 * Resolve a stored picture path (e.g. `/uploads/x.png`, `uploads/x.png`, or a
 * legacy absolute localhost URL) into a URL the browser can load.
 */
export function resolvePictureSrc(picture?: string | null): string | null {
  if (!picture) return null;
  const trimmed = picture.trim();
  if (!trimmed) return null;
  const apiBase = config.apiUrl || window.location.origin;

  if (trimmed.startsWith('/uploads')) {
    return config.apiUrl ? `${config.apiUrl}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith('uploads/')) {
    return config.apiUrl ? `${config.apiUrl}/${trimmed}` : `/${trimmed}`;
  }
  if (LOCAL_ORIGINS.some((origin) => trimmed.startsWith(origin))) {
    try {
      const url = new URL(trimmed);
      return `${apiBase}${url.pathname}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}
