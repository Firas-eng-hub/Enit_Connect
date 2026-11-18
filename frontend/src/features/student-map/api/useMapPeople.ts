import { useQuery } from '@tanstack/react-query';
import httpClient from '@/shared/api/httpClient';
import type { MapPerson } from '../model/types';

interface RawMapPerson extends Omit<MapPerson, 'lat' | 'lng'> {
  lat: number | string;
  lng: number | string;
}

const toPerson = (raw: RawMapPerson): MapPerson | null => {
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!raw.id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { ...raw, lat, lng };
};

/** People for the network map; `searchKey` empty means "everyone". */
export function useMapPeople(property: string, searchKey: string) {
  return useQuery({
    queryKey: ['student-map', property, searchKey],
    queryFn: async () => {
      const response = await httpClient.get<RawMapPerson[]>('/api/student/location', {
        params: { property, key: searchKey },
      });
      return (Array.isArray(response.data) ? response.data : [])
        .map(toPerson)
        .filter((p): p is MapPerson => p !== null);
    },
    staleTime: 60_000,
  });
}
