import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinOff, X } from 'lucide-react';
import { Alert, EmptyState, Skeleton } from '@/shared/ui';
import { useMapCells, useMapPeople, useMapStats } from '../api/mapApi';
import { cellKey, countInBounds, hasActiveFilters } from '../model/filters';
import { EMPTY_FILTERS, type ListScope, type MapBounds, type MapCell, type MapPerson } from '../model/types';
import { MapFilters } from './MapFilters';
import { MapStatsStrip } from './MapStatsStrip';
import { PeopleList } from './PeopleList';
import { StudentNetworkMap, type FocusRequest } from './StudentNetworkMap';

interface NetworkMapPanelProps {
  /** Search property and key from the student search form; empty key = everyone. */
  property: string;
  searchKey: string;
}

type CellScope = Extract<ListScope, { kind: 'cell' }>;

const EMPTY_STATS = { total: 0, countries: 0, topCities: [], topEmployers: [] };
const EMPTY_OPTIONS = { promotions: [], classes: [] };

export function NetworkMapPanel({ property, searchKey }: NetworkMapPanelProps) {
  const { t } = useTranslation();
  const search = useMemo(() => ({ property, key: searchKey }), [property, searchKey]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [areaOnly, setAreaOnly] = useState(false);
  const [cellScope, setCellScope] = useState<CellScope | null>(null);
  const [hovered, setHovered] = useState<MapPerson | null>(null);
  const [selected, setSelected] = useState<MapPerson | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const scope: ListScope = cellScope ?? (areaOnly && bounds ? { kind: 'area', bounds } : { kind: 'all' });

  const cellsQuery = useMapCells(search, filters);
  const statsQuery = useMapStats(search, filters);
  const peopleQuery = useMapPeople(search, filters, scope);

  const cells = useMemo(() => cellsQuery.data ?? [], [cellsQuery.data]);
  const people = useMemo(() => peopleQuery.data?.pages.flatMap((page) => page.data) ?? [], [peopleQuery.data]);
  const stats = statsQuery.data?.stats ?? EMPTY_STATS;
  const options = statsQuery.data?.options ?? EMPTY_OPTIONS;

  const listCount =
    scope.kind === 'cell' ? scope.count : scope.kind === 'area' ? countInBounds(cells, scope.bounds) : stats.total;

  const highlighted = hovered ?? selected;
  const activeCellId = highlighted
    ? cellKey(highlighted.lat, highlighted.lng)
    : cellScope
      ? cellKey(cellScope.lat, cellScope.lng)
      : null;

  const changeFilters = useCallback((next: typeof filters) => {
    setFilters(next);
    setCellScope(null);
    setSelected(null);
  }, []);

  const selectCell = useCallback((cell: MapCell) => {
    if (cell.person) {
      setSelected(cell.person); // its popup opens on click
      return;
    }
    setSelected(null);
    setCellScope({ kind: 'cell', lat: cell.lat, lng: cell.lng, label: cell.label, count: cell.count });
  }, []);

  const focusPerson = useCallback((person: MapPerson) => {
    setSelected(person);
    setFocusRequest((prev) => ({ lat: person.lat, lng: person.lng, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = peopleQuery;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (cellsQuery.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px]" />)}
        </div>
        <Skeleton className="h-[520px] lg:h-[640px]" />
      </div>
    );
  }

  if (cellsQuery.isError) {
    return (
      <Alert variant="danger" action={{ label: t('studentMap.retry'), onClick: () => cellsQuery.refetch() }}>
        {t('studentMap.loadError')}
      </Alert>
    );
  }

  const unfiltered = !searchKey && !hasActiveFilters(filters);

  return (
    <div className="space-y-4">
      <MapStatsStrip stats={stats} />
      <MapFilters filters={filters} options={options} onChange={changeFilters} />

      <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface lg:h-[640px] lg:flex-row">
        <aside className="order-2 flex max-h-[360px] flex-col border-t border-line lg:order-1 lg:max-h-none lg:w-[320px] lg:border-e lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">{t('studentMap.listCount', { total: listCount.toLocaleString() })}</p>
            {!cellScope && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-body">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-[rgb(var(--ink))]"
                  checked={areaOnly}
                  onChange={(e) => setAreaOnly(e.target.checked)}
                />
                {t('studentMap.areaOnly')}
              </label>
            )}
          </div>
          {cellScope && (
            <div className="flex items-center justify-between gap-2 border-b border-line bg-gold-50 px-4 py-2">
              <p className="truncate text-xs font-medium text-ink">
                {t('studentMap.scopeCell', { place: cellScope.label ?? '—' })}
              </p>
              <button
                type="button"
                onClick={() => setCellScope(null)}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t('studentMap.clearScope')}
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto" aria-busy={peopleQuery.isFetching}>
            <PeopleList
              people={people}
              activeId={highlighted?.id ?? null}
              hasMore={!!hasNextPage}
              loadingMore={isFetchingNextPage}
              onLoadMore={loadMore}
              onHover={setHovered}
              onFocus={focusPerson}
            />
          </div>
        </aside>

        <div className="relative order-1 h-[420px] flex-1 lg:order-2 lg:h-auto">
          <StudentNetworkMap
            cells={cells}
            activeCellId={activeCellId}
            focusRequest={focusRequest}
            onCellSelect={selectCell}
            onBoundsChange={setBounds}
          />
          {cells.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
              <EmptyState
                icon={<MapPinOff className="h-6 w-6" />}
                title={unfiltered ? t('studentMap.noDataTitle') : t('studentMap.noMatchesTitle')}
                description={unfiltered ? t('studentMap.noDataBody') : t('studentMap.noMatchesBody')}
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
