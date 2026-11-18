import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';
import { FOLDERS } from '../lib/mail';
import type { MailFolder } from '../model/types';
import { fieldClass } from './fieldStyles';

interface FolderToolbarProps {
  folder: MailFolder;
  onFolderChange: (folder: MailFolder) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onApplySearch: () => void;
}

export function FolderToolbar({ folder, onFolderChange, search, onSearchChange, onApplySearch }: FolderToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <nav aria-label={t('mailbox.folderNav')} className="flex flex-wrap gap-1 border-b border-line">
        {FOLDERS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onFolderChange(key)}
            aria-current={folder === key ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium',
              folder === key ? 'border-gold text-ink' : 'border-transparent text-muted-foreground hover:text-ink'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t(`mailbox.folders.${key}`)}
          </button>
        ))}
      </nav>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onApplySearch();
        }}
      >
        <input
          type="search"
          aria-label={t('mailbox.searchPlaceholder')}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('mailbox.searchPlaceholder')}
          className={fieldClass}
        />
        <Button type="submit" variant="secondary" className="h-10">{t('mailbox.apply')}</Button>
      </form>
    </div>
  );
}
