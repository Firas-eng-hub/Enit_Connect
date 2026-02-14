import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerApi } from './api';
import type { CreatePartnerPayload } from './types';

const partnersQueryKey = ['partners'] as const;

export function usePartners(refetchInterval?: number) {
  return useQuery({
    queryKey: partnersQueryKey,
    queryFn: () => partnerApi.getAll().then((res) => res.data),
    refetchInterval,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePartnerPayload) => partnerApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnersQueryKey });
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => partnerApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnersQueryKey });
    },
  });
}

export function useUploadPartnerLogo() {
  return useMutation({
    mutationFn: (formData: FormData) => partnerApi.uploadLogo(formData).then((res) => res.data.logoUrl),
  });
}
