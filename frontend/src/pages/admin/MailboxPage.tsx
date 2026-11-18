import { useTranslation } from 'react-i18next';
import { MailboxView } from '@/features/mailbox/MailboxView';

export function MailboxPage() {
  const { t } = useTranslation();
  return (
    <MailboxView
      title={t('mailbox.pageTitleAdmin')}
      subtitle={t('mailbox.subtitleAdmin')}
      canModerate
      supportInboxPath="/admin/messages"
    />
  );
}
