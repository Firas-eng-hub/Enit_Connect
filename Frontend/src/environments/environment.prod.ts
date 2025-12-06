export const environment = {
  production: true,
  // In Docker, nginx proxies /api/* to backend
  // So we use relative path which defaults to same origin
  apiUrl: '/api'
};
