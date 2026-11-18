import { Archive, Inbox, Send, Star } from 'lucide-react';
import { config } from '@/app/config/env';
import type { MailAttachment, MailFolder, MailItem, RecipientOption } from '../model/types';

export const FOLDERS: Array<{ key: MailFolder; icon: typeof Inbox }> = [
  { key: 'inbox', icon: Inbox },
  { key: 'sent', icon: Send },
  { key: 'drafts', icon: Archive },
  { key: 'favorites', icon: Star },
];

export const MAX_COMPOSE_ATTACHMENTS = 5;
export const COMPOSE_ATTACHMENT_PAGE_SIZE = 50;
export const COMPOSE_ATTACHMENT_MAX_PAGES = 20;

export const recipientKey = (recipient: Pick<RecipientOption, 'type' | 'id'>) =>
  `${recipient.type}:${recipient.id}`;

export const dedupeRecipients = (rows: RecipientOption[]) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = recipientKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const resolveFileUrl = (link?: string | null) => {
  if (!link) return null;
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  if (link.startsWith('/uploads')) return config.apiUrl ? `${config.apiUrl}${link}` : link;
  if (link.startsWith('uploads/')) return config.apiUrl ? `${config.apiUrl}/${link}` : `/${link}`;
  return link;
};

const normalizeExtension = (extension?: string | null) =>
  String(extension || '').trim().toLowerCase().replace(/^\./, '');

export const resolveAttachmentExtension = (attachment: MailAttachment) => {
  const explicit = normalizeExtension(attachment.extension);
  if (explicit) return explicit;
  const lastSegment = String(attachment.link || '').split('?')[0].split('/').pop() || '';
  const parts = lastSegment.split('.');
  return parts.length < 2 ? '' : normalizeExtension(parts.pop());
};

export const matchesActiveFolder = (item: MailItem, activeFolder: MailFolder) =>
  activeFolder === 'favorites' ? item.starred : item.folder === activeFolder;

/** Moderation does not apply to admins or system senders. */
export const canModerateSender = (item: MailItem) =>
  item.sender.type !== 'admin' && item.sender.type !== 'system';
