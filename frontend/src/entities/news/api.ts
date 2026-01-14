import httpClient from '@/shared/api/httpClient';
import type { News } from './types';

export const newsApi = {
  getAll: () =>
    httpClient.get<News[]>('/api/admin/news'),

  create: (data: FormData) =>
    httpClient.post<News>('/api/admin/news', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    httpClient.delete(`/api/admin/news/${id}`),
};
