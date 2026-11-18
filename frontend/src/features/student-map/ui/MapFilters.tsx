import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { EMPTY_FILTERS, type MapFilters as Filters, type PersonTypeFilter } from '../model/types';
import { hasActiveFilters } from '../model/filters';

interface MapFiltersProps {
  filters: Filters;
  options: { promotions: string[]; classes: string[] };
  onChange: (filters: Filters) => void;
}

const selectClass =
  'h-9 rounded-md border border-neutral-400 bg-surface px-2.5 text-sm text-ink hover:border-neutral-500 focus:border-ink focus:outline-none focus:ring-2 focus:ring-gold/40';

export function MapFilters({ filters, options, onChange }: MapFiltersProps) {
  const { t } = useTranslation();
  const types: { value: PersonTypeFilter; label: string }[] = [
    { value: 'all', label: t('studentMap.filterAll') },
    { value: 'Student', label: t('studentMap.filterStudents') },
    { value: 'Alumni', label: t('studentMap.filterAlumni') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label={t('studentMap.filterType')} className="inline-flex rounded-md border border-line bg-canvas p-0.5">
        {types.map((type) => (
          <button
            key={type.value}
            type="button"
            role="radio"
            aria-checked={filters.type === type.value}
            onClick={() => onChange({ ...filters, type: type.value })}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-colors',
              filters.type === type.value ? 'bg-ink text-white' : 'text-body hover:bg-surface'
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      <select
        aria-label={t('studentMap.allPromotions')}
        className={selectClass}
        value={filters.promotion}
        onChange={(e) => onChange({ ...filters, promotion: e.target.value })}
      >
        <option value="">{t('studentMap.allPromotions')}</option>
        {options.promotions.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        aria-label={t('studentMap.allClasses')}
        className={selectClass}
        value={filters.className}
        onChange={(e) => onChange({ ...filters, className: e.target.value })}
      >
        <option value="">{t('studentMap.allClasses')}</option>
        {options.classes.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm text-body">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[rgb(var(--ink))]"
          checked={filters.employedOnly}
          onChange={(e) => onChange({ ...filters, employedOnly: e.target.checked })}
        />
        {t('studentMap.employedOnly')}
      </label>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-primary-700 hover:bg-primary-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t('studentMap.resetFilters')}
        </button>
      )}
    </div>
  );
}
