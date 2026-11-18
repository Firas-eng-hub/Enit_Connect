import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import type { MailRole } from '../model/types';
import type { ComposeState } from '../hooks/useCompose';
import { RecipientPicker } from './RecipientPicker';
import { AttachmentPicker } from './AttachmentPicker';
import { fieldClass } from './fieldStyles';

export function ComposePanel({ compose, userType }: { compose: ComposeState; userType: MailRole | null }) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="compose-heading" className="space-y-4 rounded-lg border border-line bg-surface p-5">
      <h2 id="compose-heading" className="text-lg">{t('mailbox.composeTitle')}</h2>

      <RecipientPicker compose={compose} userType={userType} />

      <div>
        <label htmlFor="compose-subject" className="mb-1.5 block text-sm font-medium text-ink">{t('mailbox.subject')}</label>
        <input
          id="compose-subject"
          value={compose.subject}
          onChange={(event) => compose.setSubject(event.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="compose-body" className="mb-1.5 block text-sm font-medium text-ink">{t('mailbox.message')}</label>
        <textarea
          id="compose-body"
          value={compose.body}
          onChange={(event) => compose.setBody(event.target.value)}
          placeholder={t('mailbox.writeMessage')}
          rows={6}
          className={`${fieldClass} h-auto py-2 resize-y`}
        />
      </div>

      {compose.canAttach && <AttachmentPicker compose={compose} />}

      <div className="flex flex-wrap gap-2">
        <Button isLoading={compose.sending} disabled={!compose.canSend} onClick={compose.send}>
          {t('mailbox.send')}
        </Button>
        <Button variant="secondary" disabled={compose.sending || !compose.canSaveDraft} onClick={compose.saveDraft}>
          {t('mailbox.saveDraft')}
        </Button>
      </div>
    </section>
  );
}
