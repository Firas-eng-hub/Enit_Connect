import type { LatLngTuple } from 'leaflet';
import { config } from '@/app/config/env';

export const DEFAULT_CENTER: LatLngTuple = [34.5, 9.5]; // Tunisia
export const DEFAULT_ZOOM = 6;
// Positions are snapped to ~11 km, so zooming past city level would only fake
// precision. At this zoom, people sharing a city point spiderfy instead.
export const MAX_ZOOM = 12;

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Public OSM tiles need no key (fine for a campus-sized audience, per the OSM tile
// usage policy). Set VITE_MAP_TILE_URL to switch to a keyed provider in production.
export const TILE_URL = config.mapTileUrl || OSM_TILE_URL;
export const TILE_ATTRIBUTION = config.mapTileUrl ? config.mapTileAttribution : OSM_ATTRIBUTION;
/** The brand tint filter is tuned for the busy OSM palette; custom styles keep their own look. */
export const USE_TILE_TINT = !config.mapTileUrl;
