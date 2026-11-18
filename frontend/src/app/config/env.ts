// Environment configuration
// In production (Docker), VITE_API_URL is empty and nginx proxies /api/* to backend
// In development, VITE_API_URL points to backend directly (e.g., http://localhost:3000)

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  // Optional raster tile template for the student map (e.g. a keyed CARTO/MapTiler URL).
  // Falls back to the public OpenStreetMap tiles when unset.
  mapTileUrl: import.meta.env.VITE_MAP_TILE_URL || '',
  mapTileAttribution: import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '',
} as const;
