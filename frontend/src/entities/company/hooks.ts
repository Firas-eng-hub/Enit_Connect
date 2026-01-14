import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from './api';
import type { Company } from './types';

export function useCompanyProfile(id: string | null) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyApi.getProfile(id!).then((res) => res.data),
    enabled: !!id,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
      companyApi.updateProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });
}

export function useCompanySearch() {
  return useMutation({
    mutationFn: (query: string) => companyApi.search(query).then((res) => res.data),
  });
}
