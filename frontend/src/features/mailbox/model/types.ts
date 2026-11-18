export type MailFolder = 'inbox' | 'sent' | 'drafts' | 'favorites';
export type MailRole = 'student' | 'company' | 'admin';
export type RecipientRole = MailRole | 'group';
export type RecipientFilter = 'all' | MailRole;

export interface MailUser {
  id: string;
  type: MailRole | 'system';
  name: string;
  email: string | null;
}

export interface MailAttachment {
  documentId: string;
  title: string;
  link: string;
  extension?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export interface AttachmentPreview {
  title: string;
  url: string;
  mimeType: string;
  extension: string;
}

export interface MailItem {
  id: string;
  messageId: string;
  folder: MailFolder;
  read: boolean;
  starred: boolean;
  subject: string;
  body: string;
  preview: string;
  sentAt: string;
  sender: MailUser;
  recipients: MailUser[];
  extra?: {
    attachments?: MailAttachment[];
    [key: string]: unknown;
  };
}

export interface RecipientOption {
  id: string;
  type: RecipientRole;
  name: string;
  email: string;
  status?: string | null;
}

export interface ComposeAttachmentOption {
  id: string;
  title: string;
  extension?: string | null;
  category?: string | null;
  tags?: string[];
}

/** Shared feedback channel so every part of the mailbox reports to one banner. */
export interface MailFeedback {
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
}
