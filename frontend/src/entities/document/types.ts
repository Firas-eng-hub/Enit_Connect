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
