import { useTranslation } from 'react-i18next';
import { cn, formatDateTime } from '@/shared/lib/utils';
import type { MailFolder, MailItem } from '../model/types';

interface MailListProps {
  items: MailItem[];
  folder: MailFolder;
  loading: boolean;
  selectedId?: string;
  onOpen: (item: MailItem) => void;
}

export function MailList({ items, folder, loading, selectedId, onOpen }: MailListProps) {
  const { t } = useTranslation();
  const showUnread = folder === 'inbox' || folder === 'favorites';

  if (loading) return <p className="p-5 text-sm text-muted-foreground">{t('mailbox.loading')}</p>;
  if (items.length === 0) {
    return (
      <p className="p-5 text-sm text-muted-foreground">
        {t('mailbox.emptyFolder', { folder: t(`mailbox.folders.${folder}`) })}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const unread = showUnread && !item.read;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              aria-current={selectedId === item.id ? 'true' : undefined}
              className={cn('w-full px-4 py-3 text-start hover:bg-canvas', selectedId === item.id && 'bg-primary-50')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={cn('flex items-center gap-2 truncate text-sm', unread ? 'font-semibold text-ink' : 'text-body')}>
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-ink" aria-hidden="true" />}
                    {unread && <span className="sr-only">{t('mailbox.unreadLabel')}</span>}
                    <span className="truncate">{item.subject}</span>
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.sender.name} · {item.preview}
                  </p>
                </div>
                <time dateTime={item.sentAt} className="whitespace-nowrap text-xs text-muted-foreground">
                  {item.sentAt ? formatDateTime(item.sentAt) : '–'}
                </time>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
