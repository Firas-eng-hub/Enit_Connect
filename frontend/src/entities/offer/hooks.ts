import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerApi } from './api';
import type { Offer } from './types';

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: () => offerApi.getAll().then((res) => res.data),
  });
}

export function useOffer(id: string | null) {
  return useQuery({
    queryKey: ['offer', id],
    queryFn: () => offerApi.getById(id!).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Offer, '_id' | 'companyid' | 'candidacies' | 'createdAt'>) =>
      offerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });
}

export function useCandidacies(offerId: string | null) {
  return useQuery({
    queryKey: ['candidacies', offerId],
    queryFn: () => offerApi.getCandidacies(offerId!).then((res) => res.data),
    enabled: !!offerId,
  });
}
