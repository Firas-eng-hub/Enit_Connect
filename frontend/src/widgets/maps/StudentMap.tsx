import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StudentLocation {
  lat: number;
  lng: number;
  name: string;
  url: string;
}

interface StudentMapProps {
  locations: StudentLocation[];
}

export function StudentMap({ locations }: StudentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([36.8, 10.1], 2); // Tunisia center, world zoom
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || locations.length === 0) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Custom icon
    const studentIcon = L.divIcon({
      className: 'custom-student-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #1a3a5c 0%, #2563eb 100%);
          border: 3px solid white;
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

    // Add markers for each student location
    const bounds: L.LatLngTuple[] = [];
    locations.forEach((location) => {
      if (location.lat && location.lng) {
        L.marker([location.lat, location.lng], { icon: studentIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 8px; min-width: 150px;">
              <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 4px; font-size: 14px;">
                ${location.name}
              </div>
              <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">
                📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
              </div>
              ${location.url ? `
                <a href="${location.url}" 
                   style="
                     display: inline-block;
                     padding: 6px 12px;
                     background: linear-gradient(to right, #1a3a5c, #2563eb);
                     color: white;
                     text-decoration: none;
                     border-radius: 6px;
                     font-size: 12px;
                     font-weight: 600;
                   "
                   target="_blank">
                  View Profile
                </a>
              ` : ''}
            </div>
          `);
        bounds.push([location.lat, location.lng]);
      }
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="absolute inset-0 rounded-2xl overflow-hidden" />
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Location Data</h3>
            <p className="text-gray-600">Students don't have location information yet</p>
          </div>
        </div>
      )}
    </div>
  );
}
