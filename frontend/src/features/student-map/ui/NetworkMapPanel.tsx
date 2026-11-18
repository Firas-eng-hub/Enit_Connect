import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinOff } from 'lucide-react';
import { Alert, EmptyState, Skeleton } from '@/shared/ui';
import { useMapPeople } from '../api/useMapPeople';
import { applyFilters, getFilterOptions, isWithinBounds } from '../model/filters';
import { computeStats } from '../model/stats';
import { EMPTY_FILTERS, type MapBounds } from '../model/types';
import { MapFilters } from './MapFilters';
import { MapStatsStrip } from './MapStatsStrip';
import { PeopleList } from './PeopleList';
import { StudentNetworkMap, type FocusRequest } from './StudentNetworkMap';

interface NetworkMapPanelProps {
  /** Search property and key from the student search form; empty key = everyone. */
  property: string;
  searchKey: string;
}

export function NetworkMapPanel({ property, searchKey }: NetworkMapPanelProps) {
  const { t } = useTranslation();
  const { data: people = [], isLoading, isError, refetch } = useMapPeople(property, searchKey);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [areaOnly, setAreaOnly] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const options = useMemo(() => getFilterOptions(people), [people]);
  const filtered = useMemo(() => applyFilters(people, filters), [people, filters]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const listed = useMemo(
    () => (areaOnly && bounds ? filtered.filter((p) => isWithinBounds(p, bounds)) : filtered),
    [areaOnly, bounds, filtered]
  );

  const focusPerson = useCallback((id: string) => {
    setSelectedId(id);
    setFocusRequest((prev) => ({ id, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px]" />)}
        </div>
        <Skeleton className="h-[520px] lg:h-[640px]" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" action={{ label: t('studentMap.retry'), onClick: () => refetch() }}>
        {t('studentMap.loadError')}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <MapStatsStrip stats={stats} />
      <MapFilters filters={filters} options={options} onChange={setFilters} />

      <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface lg:h-[640px] lg:flex-row">
        <aside className="order-2 flex max-h-[360px] flex-col border-t border-line lg:order-1 lg:max-h-none lg:w-[320px] lg:border-e lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">{t('studentMap.listCount', { count: listed.length })}</p>
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-body">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-[rgb(var(--ink))]"
                checked={areaOnly}
                onChange={(e) => setAreaOnly(e.target.checked)}
              />
              {t('studentMap.areaOnly')}
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PeopleList people={listed} activeId={selectedId ?? hoveredId} onHover={setHoveredId} onFocus={focusPerson} />
          </div>
        </aside>

        <div className="relative order-1 h-[420px] flex-1 lg:order-2 lg:h-auto">
          <StudentNetworkMap
            people={filtered}
            activeId={hoveredId ?? selectedId}
            focusRequest={focusRequest}
            onSelect={setSelectedId}
            onBoundsChange={setBounds}
          />
          {filtered.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
              <EmptyState
                icon={<MapPinOff className="h-6 w-6" />}
                title={people.length === 0 ? t('studentMap.noDataTitle') : t('studentMap.noMatchesTitle')}
                description={people.length === 0 ? t('studentMap.noDataBody') : t('studentMap.noMatchesBody')}
                className="max-w-sm rounded-lg border border-line bg-surface/95 px-5 py-4 shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t('studentMap.privacyNote')}</p>
    </div>
  );
}
