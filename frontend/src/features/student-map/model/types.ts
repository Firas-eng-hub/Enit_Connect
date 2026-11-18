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

/** Plain bounds object so filtering stays independent of Leaflet. */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

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
