import { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type L from 'leaflet';
import { resolvePictureSrc } from '@/shared/lib/media';
import type { MapCell } from '../model/types';
import { createCountIcon, createPersonIcon, markerPeople } from './personIcon';
import { PersonPopup } from './PersonPopup';

interface CellMarkerProps {
  cell: MapCell;
  cellId: string;
  active: boolean;
  onSelect: (cell: MapCell) => void;
  registerMarker: (cellId: string, marker: L.Marker | null) => void;
}

/** A single-person cell shows that person's pin + popup; a multi-person cell a count bubble. */
export const CellMarker = memo(function CellMarker({ cell, cellId, active, onSelect, registerMarker }: CellMarkerProps) {
  const { person } = cell;
  const icon = useMemo(
    () =>
      person
        ? createPersonIcon(person.name, resolvePictureSrc(person.picture), active)
        : createCountIcon(cell.count, active),
    [person, cell.count, active]
  );
  const eventHandlers = useMemo(() => ({ click: () => onSelect(cell) }), [onSelect, cell]);

  return (
    <Marker
      position={[cell.lat, cell.lng]}
      icon={icon}
      zIndexOffset={active ? 1000 : 0}
      ref={(marker) => {
        if (marker) markerPeople.set(marker, cell.count);
        registerMarker(cellId, marker);
      }}
      eventHandlers={eventHandlers}
    >
      {person && (
        <Popup className="student-map-popup" closeButton={false} autoPanPadding={[24, 24]}>
          <PersonPopup person={person} />
        </Popup>
      )}
    </Marker>
  );
});
