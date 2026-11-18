import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { MAX_COMPOSE_ATTACHMENTS } from '../lib/mail';
import type { ComposeState } from '../hooks/useCompose';

/** Lets students attach documents from their library (max MAX_COMPOSE_ATTACHMENTS). */
export function AttachmentPicker({ compose }: { compose: ComposeState }) {
  const { t } = useTranslation();
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">{t('mailbox.attachOptional')}</legend>
      <p className="mb-1.5 text-sm text-muted-foreground">
        {t('mailbox.selectedCount', { count: compose.attachmentIds.length, max: MAX_COMPOSE_ATTACHMENTS })}
      </p>
      <div className="max-h-48 overflow-y-auto rounded-md border border-line">
        {compose.documentsLoading ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">{t('mailbox.loadingDocuments')}</p>
        ) : compose.documents.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">{t('mailbox.noDocuments')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {compose.documents.map((document) => {
              const checked = compose.attachmentIds.includes(document.id);
              return (
                <li key={document.id}>
                  <label className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', checked ? 'bg-primary-50' : 'hover:bg-canvas')}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => compose.toggleAttachment(document.id)}
                      className="h-4 w-4 accent-[rgb(var(--ink))]"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{document.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {document.extension ? `.${document.extension}` : t('mailbox.document')}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </fieldset>
  );
}
