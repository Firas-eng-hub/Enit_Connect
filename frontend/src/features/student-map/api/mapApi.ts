import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import httpClient from '@/shared/api/httpClient';
import { scopeParams, toQueryParams } from '../model/filters';
import type { FilterOptions, ListScope, MapCell, MapFilters, MapPerson, MapSearch, MapStats } from '../model/types';

const PAGE_SIZE = 30;

/** All city cells for the current search + filters (bounded server-side). */
export function useMapCells(search: MapSearch, filters: MapFilters) {
  const params = toQueryParams(search, filters);
  return useQuery({
    queryKey: ['student-map', 'cells', params],
    queryFn: async () => (await httpClient.get<MapCell[]>('/api/student/map/cells', { params })).data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/** Totals, top cities/employers and the filter dropdown options. */
export function useMapStats(search: MapSearch, filters: MapFilters) {
  const params = toQueryParams(search, filters);
  return useQuery({
    queryKey: ['student-map', 'stats', params],
    queryFn: async () =>
      (await httpClient.get<{ stats: MapStats; options: FilterOptions }>('/api/student/map/stats', { params })).data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

interface PeoplePage {
  data: MapPerson[];
  nextCursor: string | null;
}

/** Keyset-paginated people for the side list, limited to the list scope. */
export function useMapPeople(search: MapSearch, filters: MapFilters, scope: ListScope) {
  const params = { ...toQueryParams(search, filters), ...scopeParams(scope), limit: String(PAGE_SIZE) };
  return useInfiniteQuery({
    queryKey: ['student-map', 'people', params],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) =>
      (
        await httpClient.get<PeoplePage>('/api/student/map/people', {
          params: pageParam ? { ...params, cursor: pageParam } : params,
        })
      ).data,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
