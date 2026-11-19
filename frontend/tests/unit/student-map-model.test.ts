import { describe, it, expect } from 'vitest';
import {
  cellKey,
  countInBounds,
  formatCount,
  hasActiveFilters,
  isWithinBounds,
  scopeParams,
  toBboxParam,
  toQueryParams,
} from '@/features/student-map/model/filters';
import { EMPTY_FILTERS, type MapCell } from '@/features/student-map/model/types';

const cell = (lat: number, lng: number, count: number): MapCell => ({ lat, lng, count, label: null, person: null });
const search = { property: 'firstname', key: '' };

describe('map query params', () => {
  it('only sends active filters', () => {
    expect(toQueryParams(search, EMPTY_FILTERS)).toEqual({ property: 'firstname', key: '' });
    expect(
      toQueryParams({ property: 'city', key: 'Tunis' }, { type: 'Alumni', promotion: '2020', className: 'GI', employedOnly: true })
    ).toEqual({ property: 'city', key: 'Tunis', type: 'Alumni', promotion: '2020', class: 'GI', employed: 'true' });
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, employedOnly: true })).toBe(true);
  });

  it('builds list scope params', () => {
    expect(scopeParams({ kind: 'all' })).toEqual({});
    expect(scopeParams({ kind: 'cell', lat: 36.8, lng: 10.2, label: 'Tunis', count: 3 })).toEqual({ cell: '36.8,10.2' });
    expect(scopeParams({ kind: 'area', bounds: { south: 30.123, west: 7.456, north: 38.987, east: 12.001 } })).toEqual({
      bbox: '30.12,7.46,38.99,12',
    });
  });

  it('clamps and wraps bbox values Leaflet can report', () => {
    expect(toBboxParam({ south: -95, north: 95, west: -200, east: 200 })).toBe('-90,-180,90,180');
    expect(toBboxParam({ south: 0, north: 10, west: 190, east: 200 })).toBe('0,-170,10,-160');
  });
});

describe('cells helpers', () => {
  it('counts people in view from cells', () => {
    const cells = [cell(36.8, 10.2, 120), cell(34.7, 10.8, 30), cell(48.9, 2.4, 9)];
    expect(countInBounds(cells, { south: 30, west: 7, north: 38, east: 12 })).toBe(150);
  });

  it('handles bounds across the antimeridian', () => {
    const pacific = { north: 10, south: -10, east: -170, west: 170 };
    expect(isWithinBounds(0, 175, pacific)).toBe(true);
    expect(isWithinBounds(0, 0, pacific)).toBe(false);
  });

  it('keys cells by their snapped coordinates', () => {
    expect(cellKey(36.8, 10.2)).toBe('36.8,10.2');
    expect(cellKey(36.80000001, 10.2)).toBe('36.8,10.2');
  });

  it('formats large counts compactly', () => {
    expect(formatCount(950)).toBe('950');
    expect(formatCount(1200)).toBe('1.2k');
    expect(formatCount(12_345)).toBe('12k');
    expect(formatCount(1_000)).toBe('1k');
    expect(formatCount(1_250_000)).toBe('1.3M');
  });
});
