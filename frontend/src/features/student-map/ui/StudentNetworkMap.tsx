import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type L from 'leaflet';
import type {} from 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import './student-map.css';
import type { MapBounds, MapPerson } from '../model/types';
import { PersonMarker } from './PersonMarker';
import { createClusterIcon } from './personIcon';
import { BoundsWatcher, FitToPeople, ResizeSync } from './mapControllers';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL, USE_TILE_TINT } from './mapConfig';


export interface FocusRequest {
  id: string;
  seq: number;
}

interface StudentNetworkMapProps {
  people: MapPerson[];
  activeId: string | null;
  focusRequest: FocusRequest | null;
  onSelect: (id: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

export function StudentNetworkMap({ people, activeId, focusRequest, onSelect, onBoundsChange }: StudentNetworkMapProps) {
  const { t } = useTranslation();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());

  const registerMarker = useCallback((id: string, marker: L.Marker | null) => {
    if (marker) markersRef.current.set(id, marker);
    else markersRef.current.delete(id);
  }, []);

  // List click: expand the cluster holding the person, then open their popup.
  useEffect(() => {
    if (!focusRequest) return;
    const marker = markersRef.current.get(focusRequest.id);
    const cluster = clusterRef.current;
    if (!marker || !cluster) return;
    cluster.zoomToShowLayer(marker, () => marker.openPopup());
  }, [focusRequest]);

  return (
    // Leaflet controls assume LTR; the surrounding page keeps its own direction.
    <div dir="ltr" className="student-map h-full w-full" role="region" aria-label={t('studentMap.mapAria')}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        worldCopyJump
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={MAX_ZOOM} className={USE_TILE_TINT ? 'student-map-tiles--tint' : undefined} />
        <ZoomControl position="topright" />
        <MarkerClusterGroup
          ref={clusterRef}
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          maxClusterRadius={48}
          iconCreateFunction={createClusterIcon}
        >
          {people.map((person) => (
            <PersonMarker
              key={person.id}
              person={person}
              active={person.id === activeId}
              onSelect={onSelect}
              registerMarker={registerMarker}
            />
          ))}
        </MarkerClusterGroup>
        <FitToPeople people={people} />
        <BoundsWatcher onChange={onBoundsChange} />
        <ResizeSync />
      </MapContainer>
    </div>
  );
}
