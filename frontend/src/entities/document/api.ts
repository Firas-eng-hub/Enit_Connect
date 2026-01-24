import httpClient from '@/shared/api/httpClient';
import type {
  AdminDocument,
  AdminDocumentShare,
  AdminDocumentVersion,
  AdminBulkActionResult,
  AdminBulkIdsPayload,
  AdminBulkMovePayload,
  AdminDocumentCreatePayload,
  AdminFolderCreatePayload,
  AdminFolderRenamePayload,
  AdminDocumentListParams,
  AdminDocumentListResponse,
  AdminShareCreatePayload,
  AdminDocumentUpdatePayload,
  Document,
} from './types';

export const documentApi = {
  // Admin documents
  listAdmin: (params?: AdminDocumentListParams) =>
    httpClient.get<AdminDocumentListResponse | AdminDocument[]>('/api/admin/documents', { params }),

  // Backwards-compatible alias currently used by existing hooks.
  getAll: () => httpClient.get<Document[]>('/api/admin/documents'),

  createAdmin: (payload: AdminDocumentCreatePayload) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    if (payload.category) formData.append('category', payload.category);
    if (payload.emplacement) formData.append('emplacement', payload.emplacement);
    if (payload.accessLevel) formData.append('accessLevel', payload.accessLevel);
    if (payload.tags?.length) formData.append('tags', payload.tags.join(','));
    return httpClient.post<AdminDocument>('/api/admin/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateAdmin: (id: string, payload: AdminDocumentUpdatePayload) =>
    httpClient.patch<AdminDocument>(`/api/admin/documents/${id}`, payload),

  replaceAdminFile: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpClient.post<AdminDocument>(`/api/admin/documents/${id}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAdmin: (id: string) => httpClient.delete(`/api/admin/documents/${id}`),

  createFolder: (payload: AdminFolderCreatePayload) =>
    httpClient.post<AdminDocument>('/api/admin/documents/folders', payload),

  renameFolder: (id: string, payload: AdminFolderRenamePayload) =>
    httpClient.patch<AdminDocument>(`/api/admin/documents/folders/${id}`, payload),

  deleteFolder: (id: string) => httpClient.delete(`/api/admin/documents/folders/${id}`),

  bulkDelete: (payload: AdminBulkIdsPayload) =>
    httpClient.post<AdminBulkActionResult>('/api/admin/documents/bulk-delete', payload),

  bulkMove: (payload: AdminBulkMovePayload) =>
    httpClient.post<AdminBulkActionResult>('/api/admin/documents/bulk-move', payload),

  bulkDownload: (payload: AdminBulkIdsPayload) =>
    httpClient.post<Blob>('/api/admin/documents/bulk-download', payload, { responseType: 'blob' }),

  createAdminShare: (id: string, payload: AdminShareCreatePayload) =>
    httpClient.post<AdminDocumentShare>(`/api/admin/documents/${id}/share`, payload),

  listAdminShares: (id: string) =>
    httpClient.get<AdminDocumentShare[]>(`/api/admin/documents/${id}/shares`),

  revokeAdminShare: (shareId: string) =>
    httpClient.patch<AdminDocumentShare>(`/api/admin/documents/shares/${shareId}/revoke`),

  listAdminVersions: (id: string) =>
    httpClient.get<AdminDocumentVersion[]>(`/api/admin/documents/${id}/versions`),

  restoreAdminVersion: (id: string, versionId: string) =>
    httpClient.post<AdminDocument>(`/api/admin/documents/${id}/versions/${versionId}/restore`),

  // Student documents (kept for compatibility; not used by admin documents feature).
  upload: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return httpClient.post<Document>('/api/student/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Backwards-compatible alias currently used by existing hooks.
  delete: (id: string) => httpClient.delete(`/api/admin/documents/${id}`),
};
