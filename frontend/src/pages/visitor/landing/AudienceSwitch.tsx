import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import type { Audience } from './pathData';

const OPTIONS: Audience[] = ['student', 'company'];

/** Two way switch; the dark thumb slides under the selected option. */
export function AudienceSwitch({ value, onChange }: { value: Audience; onChange: (next: Audience) => void }) {
  const { t, i18n } = useTranslation();
  const index = OPTIONS.indexOf(value);
  const offset = (i18n.dir() === 'rtl' ? -100 : 100) * index;

  return (
    <div role="group" aria-label={t('landing.audience.label')} className="relative inline-grid grid-cols-2 rounded-lg border border-line bg-surface p-1">
      <span
        aria-hidden="true"
        className="lp-switch-thumb absolute bottom-1 top-1 rounded-md bg-ink"
        style={{ width: 'calc(50% - 4px)', insetInlineStart: 4, transform: `translateX(${offset}%)` }}
      />
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={cn('lp-switch-option button-sm relative px-4 py-2', value === option ? 'text-white' : 'text-body hover:text-ink')}
        >
          {t(`landing.audience.${option}`)}
        </button>
      ))}
    </div>
  );
}
