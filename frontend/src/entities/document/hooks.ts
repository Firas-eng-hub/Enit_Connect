import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from './api';
import type {
  AdminBulkIdsPayload,
  AdminBulkMovePayload,
  AdminDocumentCreatePayload,
  AdminDocumentListParams,
  AdminDocumentUpdatePayload,
  AdminFolderCreatePayload,
  AdminFolderRenamePayload,
  AdminShareCreatePayload,
} from './types';

export function useAdminDocuments(params?: AdminDocumentListParams) {
  return useQuery({
    queryKey: ['admin-documents', params ?? {}],
    queryFn: async () => {
      const res = await documentApi.listAdmin(params);
      const payload = res.data as unknown;
      // Backwards compatibility: allow both `{data,total}` and `Document[]` responses.
      if (Array.isArray(payload)) {
        return { data: payload, total: payload.length };
      }
      return payload as { data: unknown[]; total: number; page?: number; pageSize?: number };
    },
  });
}

export function useCreateAdminDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminDocumentCreatePayload) => documentApi.createAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useUpdateAdminDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminDocumentUpdatePayload }) =>
      documentApi.updateAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useReplaceAdminDocumentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => documentApi.replaceAdminFile(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useDeleteAdminDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentApi.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useCreateAdminFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminFolderCreatePayload) => documentApi.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useRenameAdminFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminFolderRenamePayload }) =>
      documentApi.renameFolder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useDeleteAdminFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useBulkDeleteAdminDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminBulkIdsPayload) => documentApi.bulkDelete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useBulkMoveAdminDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminBulkMovePayload) => documentApi.bulkMove(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });
}

export function useBulkDownloadAdminDocuments() {
  return useMutation({
    mutationFn: (payload: AdminBulkIdsPayload) => documentApi.bulkDownload(payload),
  });
}

export function useAdminDocumentShares(documentId?: string) {
  return useQuery({
    queryKey: ['admin-document-shares', documentId],
    enabled: Boolean(documentId),
    queryFn: () => documentApi.listAdminShares(String(documentId)).then((res) => res.data),
  });
}

export function useCreateAdminShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminShareCreatePayload }) =>
      documentApi.createAdminShare(id, payload),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-document-shares', variables.id] });
    },
  });
}

export function useRevokeAdminShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => documentApi.revokeAdminShare(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-document-shares'] });
    },
  });
}

export function useAdminDocumentVersions(documentId?: string) {
  return useQuery({
    queryKey: ['admin-document-versions', documentId],
    enabled: Boolean(documentId),
    queryFn: () => documentApi.listAdminVersions(String(documentId)).then((res) => res.data),
  });
}

export function useRestoreAdminDocumentVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      documentApi.restoreAdminVersion(id, versionId),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      queryClient.invalidateQueries({ queryKey: ['admin-document-versions', variables.id] });
    },
  });
}

// Legacy hooks kept for compatibility with older code paths.
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentApi.getAll().then((res) => res.data),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) => documentApi.upload(file, type),
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
