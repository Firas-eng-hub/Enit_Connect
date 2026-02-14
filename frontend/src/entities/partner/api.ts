import httpClient from '@/shared/api/httpClient';
import type { CreatePartnerPayload, Partner } from './types';

export const partnerApi = {
  getAll: () => httpClient.get<Partner[]>('/api/admin/partners'),

  create: (payload: CreatePartnerPayload) =>
    httpClient.post<Partner>('/api/admin/partners', payload),

  remove: (id: string) => httpClient.delete(`/api/admin/partners/${id}`),

  uploadLogo: (formData: FormData) =>
    httpClient.post<{ logoUrl: string }>('/api/admin/partners/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
