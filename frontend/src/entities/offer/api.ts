import httpClient from '@/shared/api/httpClient';
import type { Offer, Candidacy } from './types';

export const offerApi = {
  getAll: () =>
    httpClient.get<Offer[]>('/api/offers'),

  getById: (id: string) =>
    httpClient.get<Offer>(`/api/offers/${id}`),

  create: (data: Omit<Offer, '_id' | 'companyid' | 'candidacies' | 'createdAt'>) =>
    httpClient.post<Offer>('/api/offers', data),

  delete: (id: string) =>
    httpClient.delete(`/api/offers/${id}`),

  getCandidacies: (offerId: string) =>
    httpClient.get<Candidacy[]>(`/api/offers/candidacies?id=${offerId}`),
};
