// Environment configuration
// In production (Docker), VITE_API_URL is empty and nginx proxies /api/* to backend
// In development, VITE_API_URL points to backend directly (e.g., http://localhost:3000)

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
} as const;
