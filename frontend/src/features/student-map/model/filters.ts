import type { ListScope, MapBounds, MapCell, MapFilters, MapSearch } from './types';

export function hasActiveFilters(filters: MapFilters): boolean {
  return filters.type !== 'all' || !!filters.promotion || !!filters.className || filters.employedOnly;
}

/** Query-string params shared by every /api/student/map/* call. */
export function toQueryParams(search: MapSearch, filters: MapFilters): Record<string, string> {
  const params: Record<string, string> = { property: search.property, key: search.key };
  if (filters.type !== 'all') params.type = filters.type;
  if (filters.promotion) params.promotion = filters.promotion;
  if (filters.className) params.class = filters.className;
  if (filters.employedOnly) params.employed = 'true';
  return params;
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

/** Clamp to valid ranges and round so tiny pans don't create new cache keys. */
export function toBboxParam(bounds: MapBounds): string {
  const south = Math.max(-90, round(bounds.south));
  const north = Math.min(90, round(bounds.north));
  // Leaflet can report longitudes beyond ±180 after wrapping the world.
  const wrap = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;
  const span = bounds.east - bounds.west;
  const west = span >= 360 ? -180 : round(wrap(bounds.west));
  const east = span >= 360 ? 180 : round(wrap(bounds.east));
  return `${south},${west},${north},${east}`;
}

export function scopeParams(scope: ListScope): Record<string, string> {
  if (scope.kind === 'cell') return { cell: `${scope.lat},${scope.lng}` };
  if (scope.kind === 'area') return { bbox: toBboxParam(scope.bounds) };
  return {};
}

export const cellKey = (lat: number, lng: number) => `${lat.toFixed(1)},${lng.toFixed(1)}`;

export function isWithinBounds(lat: number, lng: number, bounds: MapBounds): boolean {
  const inLat = lat <= bounds.north && lat >= bounds.south;
  if (bounds.east - bounds.west >= 360) return inLat;
  const inLng =
    bounds.west <= bounds.east
      ? lng >= bounds.west && lng <= bounds.east
      : lng >= bounds.west || lng <= bounds.east;
  return inLat && inLng;
}

/** People inside the visible area, from the (small) cell list: no request needed. */
export function countInBounds(cells: MapCell[], bounds: MapBounds): number {
  return cells.reduce((sum, c) => (isWithinBounds(c.lat, c.lng, bounds) ? sum + c.count : sum), 0);
}

/** 950 → "950", 12_345 → "12.3k", 1_200_000 → "1.2M". */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}
