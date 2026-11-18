import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MailOpen, RefreshCw, ShieldAlert, Star, Trash2, UserLock } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { cn, formatDateTime } from '@/shared/lib/utils';
import { canModerateSender } from '../lib/mail';
import type { MailFolder, MailItem } from '../model/types';

interface MessageDetailProps {
  item: MailItem;
  canModerate: boolean;
  onPatch: (payload: Partial<Pick<MailItem, 'read' | 'starred' | 'folder'>>) => void;
  onDelete: () => void;
  onSenderLock: (lock: boolean) => void;
  onHardDelete: () => void;
  /** Attachment list, rendered between the body and the actions. */
  attachments?: ReactNode;
}

const MOVE_TARGETS: Array<{ folder: Exclude<MailFolder, 'favorites'>; key: string }> = [
  { folder: 'inbox', key: 'mailbox.moveInbox' },
  { folder: 'sent', key: 'mailbox.moveSent' },
  { folder: 'drafts', key: 'mailbox.moveDrafts' },
];

export function MessageDetail({ item, canModerate, onPatch, onDelete, onSenderLock, onHardDelete, attachments }: MessageDetailProps) {
  const { t } = useTranslation();
  const moderatable = canModerateSender(item);

  return (
    <article className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg">{item.subject}</h3>
          <time dateTime={item.sentAt} className="text-sm text-muted-foreground">{formatDateTime(item.sentAt)}</time>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onPatch({ starred: !item.starred })}
            aria-pressed={item.starred}
            aria-label={item.starred ? t('mailbox.unstar') : t('mailbox.star')}
            className={cn('rounded-md border p-2', item.starred ? 'border-gold bg-gold-50 text-gold-800' : 'border-line text-muted-foreground hover:bg-canvas')}
          >
            <Star className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onPatch({ read: !item.read })}
            aria-label={item.read ? t('mailbox.markUnread') : t('mailbox.markRead')}
            className="rounded-md border border-line p-2 text-muted-foreground hover:bg-canvas"
          >
            {item.read ? <Mail className="h-4 w-4" aria-hidden="true" /> : <MailOpen className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-medium text-ink">{t('mailbox.from')}</dt>
        <dd className="text-body">
          {item.sender.name}
          {item.sender.email ? ` (${item.sender.email})` : ''}
        </dd>
        <dt className="font-medium text-ink">{t('mailbox.to')}</dt>
        <dd className="text-body">{item.recipients.map((r) => r.email || r.name).join(', ')}</dd>
      </dl>

      <div className="whitespace-pre-wrap rounded-md border border-line bg-canvas p-4 text-sm leading-relaxed text-body">
        {item.body}
      </div>

      {attachments}

      <div className="flex flex-wrap gap-2">
        {MOVE_TARGETS.map(({ folder, key }) => (
          <Button key={folder} variant="secondary" size="sm" onClick={() => onPatch({ folder })}>
            {t(key)}
          </Button>
        ))}
        <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={onDelete}>
          {t('mailbox.deletePermanently')}
        </Button>
      </div>

      {canModerate && (
        <section className="border-t border-line pt-3">
          <h4 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-ink">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            {t('mailbox.moderation')}
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" leftIcon={<UserLock className="h-4 w-4" />} onClick={() => onSenderLock(true)} disabled={!moderatable}>
              {t('mailbox.lockSender')}
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => onSenderLock(false)} disabled={!moderatable}>
              {t('mailbox.unlockSender')}
            </Button>
            <Button size="sm" variant="danger" leftIcon={<ShieldAlert className="h-4 w-4" />} onClick={onHardDelete}>
              {t('mailbox.hardDelete')}
            </Button>
          </div>
        </section>
      )}
    </article>
  );
}
