import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type L from 'leaflet';
import type {} from 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import './student-map.css';
import { cellKey } from '../model/filters';
import type { MapBounds, MapCell } from '../model/types';
import { CellMarker } from './CellMarker';
import { createClusterIcon } from './personIcon';
import { BoundsWatcher, FitToCells, ResizeSync } from './mapControllers';
import { DEFAULT_CENTER, DEFAULT_ZOOM, MAX_ZOOM, TILE_ATTRIBUTION, TILE_URL, USE_TILE_TINT } from './mapConfig';

/** Ask the map to reveal a cell (list click). `seq` makes repeat clicks re-trigger. */
export interface FocusRequest {
  lat: number;
  lng: number;
  seq: number;
}

interface StudentNetworkMapProps {
  cells: MapCell[];
  activeCellId: string | null;
  focusRequest: FocusRequest | null;
  onCellSelect: (cell: MapCell) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

export function StudentNetworkMap({ cells, activeCellId, focusRequest, onCellSelect, onBoundsChange }: StudentNetworkMapProps) {
  const { t } = useTranslation();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());

  const registerMarker = useCallback((id: string, marker: L.Marker | null) => {
    if (marker) markersRef.current.set(id, marker);
    else markersRef.current.delete(id);
  }, []);

  // List click: expand whatever cluster holds the cell, then open a person popup if it has one.
  useEffect(() => {
    if (!focusRequest) return;
    const marker = markersRef.current.get(cellKey(focusRequest.lat, focusRequest.lng));
    const cluster = clusterRef.current;
    if (!marker || !cluster) return;
    cluster.zoomToShowLayer(marker, () => {
      if (marker.getPopup()) marker.openPopup();
    });
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
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={MAX_ZOOM}
          className={USE_TILE_TINT ? 'student-map-tiles--tint' : undefined}
        />
        <ZoomControl position="topright" />
        <MarkerClusterGroup
          ref={clusterRef}
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          maxClusterRadius={48}
          iconCreateFunction={createClusterIcon}
        >
          {cells.map((cell) => {
            const id = cellKey(cell.lat, cell.lng);
            return (
              <CellMarker
                key={id}
                cell={cell}
                cellId={id}
                active={id === activeCellId}
                onSelect={onCellSelect}
                registerMarker={registerMarker}
              />
            );
          })}
        </MarkerClusterGroup>
        <FitToCells cells={cells} />
        <BoundsWatcher onChange={onBoundsChange} />
        <ResizeSync />
      </MapContainer>
    </div>
  );
}
