import httpClient from '@/shared/api/httpClient';
import type { Student } from './types';

export const studentApi = {
  login: (email: string, password: string) =>
    httpClient.post<{ user: Student }>('/api/student/login', { email, password }),

  signup: (data: Partial<Student> & { password: string }) =>
    httpClient.post('/api/student/signup', data),

  getProfile: (id: string) =>
    httpClient.get<Student>(`/api/student/${id}`),

  updateProfile: (id: string, data: Partial<Student>) =>
    httpClient.patch<Student>(`/api/student/${id}`, data),

  uploadPicture: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post(`/api/student/upload/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  search: (query: string) =>
    httpClient.post<Student[]>('/api/student/search', { query }),

  apply: (offerId: string, body: string) =>
    httpClient.post(`/api/student/apply/${offerId}`, { body }),

  getCompaniesInfo: (companyIds: string[]) =>
    httpClient.post('/api/student/companiesinfo', { companies: companyIds }),
};
