// Document entity types

export interface Document {
  _id: string;
  name: string;
  path: string;
  type: string;
  size?: number;
  ownerId: string;
  ownerType: 'student' | 'company' | 'admin';
  createdAt?: string;
}

export interface UploadDocumentRequest {
  file: File;
  name?: string;
}

// Admin documents are stored in Postgres and exposed by the admin documents API.
export type AdminDocumentAudience = 'students' | 'companies' | 'internal';
export type AdminDocumentAccessLevel = 'private' | AdminDocumentAudience;
export type AdminDocumentType = 'file' | 'folder';

export interface AdminDocument {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags: string[];
  type: AdminDocumentType;
  link?: string | null;
  extension?: string | null;
  mimeType?: string | null;
  size?: string | null;
  sizeBytes?: number | null;
  emplacement: string;
  creatorId?: string | null;
  creatorName: string;
  creatorType?: string | null;
  accessLevel?: AdminDocumentAccessLevel;
  pinned?: boolean;
  version?: number | null;
  lastOpenedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type AdminDocumentListParams = {
  q?: string;
  category?: string;
  tags?: string[];
  type?: AdminDocumentType;
  emplacement?: string;
  from?: string;
  to?: string;
  sort?: 'createdAt' | 'updatedAt' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

export interface AdminDocumentListResponse {
  data: AdminDocument[];
  total: number;
  page?: number;
  pageSize?: number;
}

export type AdminDocumentCreatePayload = {
  file: File;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  emplacement?: string;
  accessLevel?: AdminDocumentAccessLevel;
};

export type AdminDocumentUpdatePayload = {
  title?: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  emplacement?: string;
  accessLevel?: AdminDocumentAccessLevel;
  pinned?: boolean;
  // Used for stale-update detection; mirrors the document's last known updated timestamp.
  updatedAt?: string | null;
};

export type AdminBulkIdsPayload = {
  ids: string[];
};

export type AdminBulkMovePayload = {
  ids: string[];
  targetPath: string;
};

export type AdminBulkActionResult = {
  successIds: string[];
  failedIds: string[];
  message?: string;
};

export type AdminFolderCreatePayload = {
  title: string;
  parentPath?: string;
};

export type AdminFolderRenamePayload = {
  title: string;
  updatedAt?: string | null;
};

export type AdminShareCreatePayload = {
  expiresInDays?: number;
  audience?: AdminDocumentAudience;
};

export interface AdminDocumentShare {
  id: string;
  documentId: string;
  shareUrl: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  requiresLogin?: boolean;
  audience?: AdminDocumentAudience;
}

export interface AdminDocumentVersion {
  id: string;
  documentId: string;
  version: number;
  link: string;
  extension?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
}
