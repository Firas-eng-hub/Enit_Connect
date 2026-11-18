import { useTranslation } from 'react-i18next';
import { Paperclip } from 'lucide-react';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { formatFileSize } from '@/shared/lib/utils';
import { resolveFileUrl } from '../lib/mail';
import type { MailAttachment } from '../model/types';

interface MessageAttachmentsProps {
  attachments: MailAttachment[];
  loadingId: string | null;
  error: string | null;
  onPreview: (attachment: MailAttachment) => void;
}

export function MessageAttachments({ attachments, loadingId, error, onPreview }: MessageAttachmentsProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-2">
      <h4 className="inline-flex items-center gap-2 text-sm font-medium text-ink">
        <Paperclip className="h-4 w-4" aria-hidden="true" />
        {t('mailbox.attachments')}
      </h4>
      <ul className="divide-y divide-line rounded-md border border-line">
        {attachments.map((attachment) => (
          <li key={attachment.documentId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{attachment.title}</p>
              <p className="text-xs text-muted-foreground">
                {attachment.sizeBytes ? formatFileSize(attachment.sizeBytes) : attachment.extension || t('mailbox.file')}
              </p>
            </div>
            {resolveFileUrl(attachment.link) ? (
              <Button size="xs" variant="secondary" onClick={() => onPreview(attachment)} disabled={loadingId === attachment.documentId}>
                {loadingId === attachment.documentId ? t('mailbox.opening') : t('mailbox.preview')}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">{t('mailbox.unavailable')}</span>
            )}
          </li>
        ))}
      </ul>
      {error && <Alert variant="danger">{error}</Alert>}
    </section>
  );
}
