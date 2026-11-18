import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { MapBounds, MapCell } from '../model/types';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './mapConfig';

/** Fit the view to the cells whenever the dataset (search/filters) changes, not on selection. */
export function FitToCells({ cells }: { cells: MapCell[] }) {
  const map = useMap();
  const signature = cells.map((c) => `${c.lat},${c.lng}`).join('|');
  const lastSignature = useRef<string | null>(null);

  useEffect(() => {
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    if (cells.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(cells.map((c) => [c.lat, c.lng] as L.LatLngTuple));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
  }, [map, cells, signature]);

  return null;
}

const toBounds = (b: L.LatLngBounds): MapBounds => ({
  north: b.getNorth(),
  south: b.getSouth(),
  east: b.getEast(),
  west: b.getWest(),
});

/** Report the visible area so the list can be limited to it. */
export function BoundsWatcher({ onChange }: { onChange: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onChange(toBounds(map.getBounds())),
  });

  useEffect(() => {
    onChange(toBounds(map.getBounds()));
  }, [map, onChange]);

  return null;
}

/** Keep Leaflet's size in sync with a container that can resize (split view, tabs). */
export function ResizeSync() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}
