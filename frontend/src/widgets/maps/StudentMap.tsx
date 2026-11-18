import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StudentLocation {
  id?: string;
  lat: number | string;
  lng: number | string;
  name: string;
}

// Built from DOM nodes with textContent so user-controlled names are never parsed as HTML.
function buildPopup(location: StudentLocation, viewProfileLabel: string, navigate: NavigateFunction) {
  const root = document.createElement('div');
  root.style.cssText = 'padding: 8px; min-width: 150px;';

  const name = document.createElement('div');
  name.style.cssText = 'font-weight: 600; color: #14304D; margin-bottom: 8px; font-size: 14px;';
  name.textContent = location.name;
  root.appendChild(name);

  if (location.id) {
    const href = `/user/student/${encodeURIComponent(location.id)}`;
    const link = document.createElement('a');
    link.href = href;
    link.textContent = viewProfileLabel;
    link.style.cssText =
      'display: inline-block; padding: 6px 12px; background: #14304D; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(href);
    });
    root.appendChild(link);
  }
  return root;
}

interface StudentMapProps {
  locations: StudentLocation[];
}

export function StudentMap({ locations }: StudentMapProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const viewProfileLabel = t('pagesMisc.viewProfile');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([36.8, 10.1], 7); // Tunisia default view
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const handleResize = () => {
      map.invalidateSize();
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(handleResize);
      observer.observe(mapRef.current);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Ensure initial sizing after mount
    setTimeout(handleResize, 0);

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Always reset markers, including when a search returns no locations.
    markersRef.current?.remove();
    const layer = L.layerGroup().addTo(map);
    markersRef.current = layer;

    const studentIcon = L.divIcon({
      className: 'custom-student-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #14304D;
          border: 3px solid #C99A3B;
          border-radius: 50%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const bounds: L.LatLngTuple[] = [];
    locations.forEach((location) => {
      const lat = Number(location.lat);
      const lng = Number(location.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      L.marker([lat, lng], { icon: studentIcon })
        .addTo(layer)
        .bindPopup(() => buildPopup(location, viewProfileLabel, navigate));
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } else {
      map.setView([36.8, 10.1], 7);
    }
  }, [locations, viewProfileLabel, navigate]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0 rounded-2xl overflow-hidden" />
      {locations.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center px-4">
          <div className="max-w-sm rounded-lg border border-line bg-surface/95 px-4 py-3 text-center shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">{t('map.noDataTitle')}</h3>
            <p className="mt-1 text-xs text-gray-600">{t('map.noDataBody')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
