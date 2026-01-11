export const environment = {
  production: true,
  // In Docker, nginx proxies /api/* to backend
  // Frontend calls use /api/... pattern directly
  apiUrl: ''
};
