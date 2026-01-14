import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from './api';

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentApi.getAll().then((res) => res.data),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) =>
      documentApi.upload(file, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
