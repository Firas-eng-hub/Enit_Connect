import type { MapBounds, MapFilters, MapPerson } from './types';

const same = (a: string | null, b: string) => (a ?? '').trim().toLowerCase() === b.trim().toLowerCase();

export function applyFilters(people: MapPerson[], filters: MapFilters): MapPerson[] {
  return people.filter((person) => {
    if (filters.type !== 'all' && !same(person.type, filters.type)) return false;
    if (filters.promotion && !same(person.promotion, filters.promotion)) return false;
    if (filters.className && !same(person.class, filters.className)) return false;
    if (filters.employedOnly && !person.workAt?.trim()) return false;
    return true;
  });
}

export function hasActiveFilters(filters: MapFilters): boolean {
  return filters.type !== 'all' || !!filters.promotion || !!filters.className || filters.employedOnly;
}

const uniqueSorted = (values: (string | null)[], compare?: (a: string, b: string) => number) => {
  const seen = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) seen.set(trimmed.toLowerCase(), trimmed);
  });
  return [...seen.values()].sort(compare ?? ((a, b) => a.localeCompare(b)));
};

export function getFilterOptions(people: MapPerson[]) {
  return {
    // Newest promotion first.
    promotions: uniqueSorted(
      people.map((p) => p.promotion),
      (a, b) => b.localeCompare(a, undefined, { numeric: true })
    ),
    classes: uniqueSorted(people.map((p) => p.class)),
  };
}

export function isWithinBounds(person: MapPerson, bounds: MapBounds): boolean {
  const inLat = person.lat <= bounds.north && person.lat >= bounds.south;
  // Bounds can cross the antimeridian (west > east).
  const inLng =
    bounds.west <= bounds.east
      ? person.lng >= bounds.west && person.lng <= bounds.east
      : person.lng >= bounds.west || person.lng <= bounds.east;
  return inLat && inLng;
}
