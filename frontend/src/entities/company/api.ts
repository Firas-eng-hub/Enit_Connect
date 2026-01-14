import httpClient from '@/shared/api/httpClient';
import type { Company } from './types';

export const companyApi = {
  login: (email: string, password: string) =>
    httpClient.post<{ company: Company }>('/api/company/login', { email, password }),

  signup: (data: Partial<Company> & { password: string }) =>
    httpClient.post('/api/company/signup', data),

  getProfile: (id: string) =>
    httpClient.get<Company>(`/api/company/${id}`),

  updateProfile: (id: string, data: Partial<Company>) =>
    httpClient.patch<Company>(`/api/company/${id}`, data),

  uploadLogo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post(`/api/company/upload/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  search: (query: string) =>
    httpClient.post<Company[]>('/api/company/search', { query }),

  getApplicantInfo: (userId: string) =>
    httpClient.get(`/api/company/user/${userId}`),
};
