import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from './api';
import type { Student } from './types';

export function useStudentProfile(id: string | null) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => studentApi.getProfile(id!).then((res) => res.data),
    enabled: !!id,
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      studentApi.updateProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    },
  });
}

export function useStudentSearch() {
  return useMutation({
    mutationFn: (query: string) => studentApi.search(query).then((res) => res.data),
  });
}

export function useApplyToOffer() {
  return useMutation({
    mutationFn: ({ offerId, body }: { offerId: string; body: string }) =>
      studentApi.apply(offerId, body),
  });
}
