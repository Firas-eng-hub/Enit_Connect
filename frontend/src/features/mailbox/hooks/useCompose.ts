import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import httpClient from '@/shared/api/httpClient';
import { getApiErrorMessage } from '@/shared/lib/utils';
import {
  COMPOSE_ATTACHMENT_MAX_PAGES,
  COMPOSE_ATTACHMENT_PAGE_SIZE,
  MAX_COMPOSE_ATTACHMENTS,
  dedupeRecipients,
  recipientKey,
} from '../lib/mail';
import type {
  ComposeAttachmentOption,
  MailFeedback,
  MailRole,
  RecipientFilter,
  RecipientOption,
} from '../model/types';

interface UseComposeOptions extends MailFeedback {
  open: boolean;
  userType: MailRole | null;
  /** Called after a message is sent ('sent') or saved as draft ('drafts'). */
  onDone: (savedTo: 'sent' | 'drafts') => void;
}

async function loadAllStudentDocuments(): Promise<ComposeAttachmentOption[]> {
  const rows: ComposeAttachmentOption[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= COMPOSE_ATTACHMENT_MAX_PAGES; page += 1) {
    const response = await httpClient.get('/api/student/documents', {
      params: { type: 'file', page, pageSize: COMPOSE_ATTACHMENT_PAGE_SIZE, emplacement: 'root' },
    });
    const batch = (response.data?.items || []) as ComposeAttachmentOption[];
    batch.forEach((row) => {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        rows.push(row);
      }
    });
    const total = Number(response.data?.total || 0);
    if (batch.length < COMPOSE_ATTACHMENT_PAGE_SIZE || rows.length >= total) break;
  }
  return rows;
}

/** State and actions for the compose panel: recipients, attachments, send and draft. */
export function useCompose({ open, userType, onDone, setError, setSuccess }: UseComposeOptions) {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientFilter>('all');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientResults, setRecipientResults] = useState<RecipientOption[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientOption[]>([]);
  const [documents, setDocuments] = useState<ComposeAttachmentOption[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const selectedKeys = useMemo(() => new Set(selectedRecipients.map(recipientKey)), [selectedRecipients]);
  const canAttach = userType === 'student';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRecipientLoading(true);
    httpClient
      .get('/api/mail/recipients', { params: { type: recipientType, q: recipientQuery, limit: 30 } })
      .then((response) => !cancelled && setRecipientResults((response.data?.data || []) as RecipientOption[]))
      .catch(() => !cancelled && setRecipientResults([]))
      .finally(() => !cancelled && setRecipientLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, recipientType, recipientQuery]);

  useEffect(() => {
    if (!open || !canAttach) return;
    let cancelled = false;
    setDocumentsLoading(true);
    loadAllStudentDocuments()
      .then((rows) => !cancelled && setDocuments(rows))
      .catch(() => !cancelled && setDocuments([]))
      .finally(() => !cancelled && setDocumentsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, canAttach]);

  const reset = () => {
    setSubject('');
    setBody('');
    setRecipientType('all');
    setRecipientQuery('');
    setRecipientResults([]);
    setSelectedRecipients([]);
    setAttachmentIds([]);
  };

  const toggleRecipient = (recipient: RecipientOption) => {
    const key = recipientKey(recipient);
    setSelectedRecipients((prev) =>
      selectedKeys.has(key) ? prev.filter((row) => recipientKey(row) !== key) : dedupeRecipients([...prev, recipient])
    );
  };

  const toggleAttachment = (documentId: string) => {
    const selected = attachmentIds.includes(documentId);
    if (!selected && attachmentIds.length >= MAX_COMPOSE_ATTACHMENTS) {
      setError(t('mailbox.attachLimit', { max: MAX_COMPOSE_ATTACHMENTS }));
      return;
    }
    setError(null);
    setAttachmentIds((prev) => (selected ? prev.filter((id) => id !== documentId) : [...prev, documentId]));
  };

  const submit = async (target: 'sent' | 'drafts') => {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await httpClient.post(target === 'sent' ? '/api/mail/compose' : '/api/mail/drafts', {
        subject,
        body,
        recipients: selectedRecipients.map(({ id, type }) => ({ id, type })),
        attachments: attachmentIds.map((documentId) => ({ documentId })),
      });
      setSuccess(target === 'sent' ? t('mailbox.sent') : t('mailbox.draftSaved'));
      reset();
      onDone(target);
    } catch (err) {
      setError(getApiErrorMessage(err, target === 'sent' ? t('mailbox.sendFailed') : t('mailbox.draftFailed')));
    } finally {
      setSending(false);
    }
  };

  return {
    subject,
    setSubject,
    body,
    setBody,
    recipientType,
    setRecipientType,
    recipientQuery,
    setRecipientQuery,
    recipientResults,
    recipientLoading,
    selectedRecipients,
    selectedKeys,
    toggleRecipient,
    canAttach,
    documents,
    documentsLoading,
    attachmentIds,
    toggleAttachment,
    sending,
    canSend: Boolean(subject.trim() && body.trim() && selectedRecipients.length > 0),
    canSaveDraft: Boolean(subject.trim() || body.trim()),
    send: () => submit('sent'),
    saveDraft: () => submit('drafts'),
    reset,
  };
}

export type ComposeState = ReturnType<typeof useCompose>;
