import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from './api';

export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: () => newsApi.getAll().then((res) => res.data),
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => newsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
}
