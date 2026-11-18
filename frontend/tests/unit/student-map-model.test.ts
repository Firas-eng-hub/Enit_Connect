import { describe, it, expect } from 'vitest';
import { applyFilters, getFilterOptions, hasActiveFilters, isWithinBounds } from '@/features/student-map/model/filters';
import { computeStats } from '@/features/student-map/model/stats';
import { EMPTY_FILTERS, type MapPerson } from '@/features/student-map/model/types';

const person = (overrides: Partial<MapPerson>): MapPerson => ({
  id: 'x',
  name: 'Test Person',
  picture: null,
  type: 'Student',
  promotion: '2024',
  class: 'GI',
  workAt: null,
  city: 'Tunis',
  country: 'Tunisia',
  lat: 36.8,
  lng: 10.2,
  ...overrides,
});

const people: MapPerson[] = [
  person({ id: 'a', type: 'Alumni', promotion: '2019', workAt: 'Acme', city: 'Paris', country: 'France', lat: 48.9, lng: 2.4 }),
  person({ id: 'b', type: 'Alumni', promotion: '2021', workAt: 'acme ', city: 'tunis' }),
  // 'tunis' appears first, but the capitalised spelling should win for display.
  person({ id: 'c', class: 'GC' }),
  person({ id: 'd', city: 'Sfax', workAt: 'Vermeg', lat: 34.7, lng: 10.8 }),
];

describe('student map filters', () => {
  it('returns everyone with empty filters', () => {
    expect(applyFilters(people, EMPTY_FILTERS)).toHaveLength(4);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
  });

  it('filters by type, promotion, class and employment (case-insensitive)', () => {
    const ids = (f: Partial<typeof EMPTY_FILTERS>) =>
      applyFilters(people, { ...EMPTY_FILTERS, ...f }).map((p) => p.id);
    expect(ids({ type: 'Alumni' })).toEqual(['a', 'b']);
    expect(ids({ promotion: '2021' })).toEqual(['b']);
    expect(ids({ className: 'gc' })).toEqual(['c']);
    expect(ids({ employedOnly: true })).toEqual(['a', 'b', 'd']);
    expect(ids({ type: 'Student', employedOnly: true })).toEqual(['d']);
  });

  it('builds de-duplicated options, newest promotion first', () => {
    const options = getFilterOptions(people);
    expect(options.promotions).toEqual(['2024', '2021', '2019']);
    expect(options.classes).toEqual(['GC', 'GI']);
  });

  it('checks bounds, including across the antimeridian', () => {
    const tunisia = { north: 38, south: 30, east: 12, west: 7 };
    expect(isWithinBounds(people[3], tunisia)).toBe(true);
    expect(isWithinBounds(people[0], tunisia)).toBe(false);
    const pacific = { north: 10, south: -10, east: -170, west: 170 };
    expect(isWithinBounds(person({ lat: 0, lng: 175 }), pacific)).toBe(true);
    expect(isWithinBounds(person({ lat: 0, lng: 0 }), pacific)).toBe(false);
  });
});

describe('student map stats', () => {
  it('counts people, countries, top cities and employers', () => {
    const stats = computeStats(people);
    expect(stats.total).toBe(4);
    expect(stats.countries).toBe(2);
    expect(stats.topCities[0]).toEqual({ label: 'Tunis', count: 2 });
    expect(stats.topEmployers[0]).toEqual({ label: 'Acme', count: 2 });
    expect(stats.topEmployers).toHaveLength(2);
  });

  it('handles an empty list', () => {
    expect(computeStats([])).toEqual({ total: 0, countries: 0, topCities: [], topEmployers: [] });
  });
});
