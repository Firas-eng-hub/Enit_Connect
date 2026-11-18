import { memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type L from 'leaflet';
import { resolvePictureSrc } from '@/shared/lib/media';
import type { MapPerson } from '../model/types';
import { createPersonIcon } from './personIcon';
import { PersonPopup } from './PersonPopup';

interface PersonMarkerProps {
  person: MapPerson;
  active: boolean;
  onSelect: (id: string) => void;
  registerMarker: (id: string, marker: L.Marker | null) => void;
}

export const PersonMarker = memo(function PersonMarker({ person, active, onSelect, registerMarker }: PersonMarkerProps) {
  const icon = useMemo(
    () => createPersonIcon(person.name, resolvePictureSrc(person.picture), active),
    [person.name, person.picture, active]
  );

  return (
    <Marker
      position={[person.lat, person.lng]}
      icon={icon}
      zIndexOffset={active ? 1000 : 0}
      ref={(marker) => registerMarker(person.id, marker)}
      eventHandlers={{ click: () => onSelect(person.id) }}
    >
      <Popup className="student-map-popup" closeButton={false} autoPanPadding={[24, 24]}>
        <PersonPopup person={person} />
      </Popup>
    </Marker>
  );
});
