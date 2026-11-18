import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { recipientKey } from '../lib/mail';
import type { MailRole, RecipientFilter } from '../model/types';
import type { ComposeState } from '../hooks/useCompose';
import { fieldClass } from './fieldStyles';

const FILTERS_BY_ROLE: Record<MailRole, RecipientFilter[]> = {
  company: ['all', 'student', 'admin'],
  student: ['all', 'student', 'company', 'admin'],
  admin: ['all', 'student', 'company', 'admin'],
};
const FILTER_LABEL: Record<RecipientFilter, string> = {
  all: 'mailbox.all',
  student: 'mailbox.students',
  company: 'mailbox.companies',
  admin: 'mailbox.admins',
};

export function RecipientPicker({ compose, userType }: { compose: ComposeState; userType: MailRole | null }) {
  const { t } = useTranslation();
  const filters = FILTERS_BY_ROLE[userType ?? 'admin'];

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1.5 text-sm font-medium text-ink">{t('mailbox.recipients')}</legend>
      <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)]">
        <select
          aria-label={t('mailbox.recipientType')}
          value={compose.recipientType}
          onChange={(event) => compose.setRecipientType(event.target.value as RecipientFilter)}
          className={fieldClass}
        >
          {filters.map((value) => (
            <option key={value} value={value}>{t(FILTER_LABEL[value])}</option>
          ))}
        </select>
        <input
          type="search"
          aria-label={t('mailbox.searchRecipients')}
          value={compose.recipientQuery}
          onChange={(event) => compose.setRecipientQuery(event.target.value)}
          placeholder={t('mailbox.searchRecipients')}
          className={fieldClass}
        />
      </div>

      <div className="max-h-52 overflow-y-auto rounded-md border border-line">
        {compose.recipientLoading ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">{t('mailbox.loadingRecipients')}</p>
        ) : compose.recipientResults.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">{t('mailbox.noRecipients')}</p>
        ) : (
          <ul className="divide-y divide-line">
            {compose.recipientResults.map((recipient) => {
              const key = recipientKey(recipient);
              const checked = compose.selectedKeys.has(key);
              return (
                <li key={key}>
                  <label className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', checked ? 'bg-primary-50' : 'hover:bg-canvas')}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => compose.toggleRecipient(recipient)}
                      className="h-4 w-4 accent-[rgb(var(--ink))]"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {recipient.name} <span className="font-normal text-muted-foreground">· {recipient.type}</span>
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">{recipient.email}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {compose.selectedRecipients.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t('mailbox.selectedRecipients')}>
          {compose.selectedRecipients.map((recipient) => (
            <li key={recipientKey(recipient)} className="inline-flex items-center gap-1 rounded bg-primary-50 py-0.5 ps-2 pe-1 text-sm text-primary-800">
              {recipient.name}
              <button
                type="button"
                onClick={() => compose.toggleRecipient(recipient)}
                className="rounded p-0.5 hover:bg-primary-100"
                aria-label={t('mailbox.removeRecipient', { name: recipient.name })}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
