import httpClient from '@/shared/api/httpClient';
import type { Document } from './types';

export const documentApi = {
  getAll: () =>
    httpClient.get<Document[]>('/api/admin/documents'),

  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return httpClient.post<Document>('/api/student/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (id: string) =>
    httpClient.delete(`/api/admin/documents/${id}`),
};
