import { MailboxView } from '@/features/mailbox/MailboxView';

export function MailboxPage() {
  return (
    <MailboxView
      title="Internal Mailbox"
      subtitle="Inbox and compose for students, companies, and admins."
      canModerate
      supportInboxPath="/admin/messages"
    />
  );
}
