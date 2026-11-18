/** A person on the network map. Coordinates are city-level (snapped server-side). */
export interface MapPerson {
  id: string;
  name: string;
  picture: string | null;
  type: string | null;
  promotion: string | null;
  class: string | null;
  workAt: string | null;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
}

/** One ~11 km city cell: the server aggregates people into these. */
export interface MapCell {
  lat: number;
  lng: number;
  count: number;
  /** Dominant city name in the cell. */
  label: string | null;
  /** Present only when the cell holds exactly one person. */
  person: MapPerson | null;
}

export type PersonTypeFilter = 'all' | 'Student' | 'Alumni';

export interface MapFilters {
  type: PersonTypeFilter;
  promotion: string;
  className: string;
  employedOnly: boolean;
}

export const EMPTY_FILTERS: MapFilters = {
  type: 'all',
  promotion: '',
  className: '',
  employedOnly: false,
};

/** The student search form's query, which the map follows. */
export interface MapSearch {
  property: string;
  key: string;
}

/** Plain bounds object so model code stays independent of Leaflet. */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** What the side list shows. */
export type ListScope =
  | { kind: 'all' }
  | { kind: 'area'; bounds: MapBounds }
  | { kind: 'cell'; lat: number; lng: number; label: string | null; count: number };

export interface RankedItem {
  label: string;
  count: number;
}

export interface MapStats {
  total: number;
  countries: number;
  topCities: RankedItem[];
  topEmployers: RankedItem[];
}

export interface FilterOptions {
  promotions: string[];
  classes: string[];
}
