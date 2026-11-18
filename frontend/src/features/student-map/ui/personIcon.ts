import L from 'leaflet';
import type {} from 'leaflet.markercluster';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}

const PIN_SIZE = 40;

/**
 * Navy pin with a gold ring holding the person's photo or initials.
 * Everything user-controlled is escaped: divIcon html is parsed as HTML.
 */
export function createPersonIcon(name: string, pictureSrc: string | null, active = false): L.DivIcon {
  const face = pictureSrc
    ? `<img src="${escapeHtml(pictureSrc)}" alt="" loading="lazy" />`
    : `<span>${escapeHtml(getInitials(name))}</span>`;
  return L.divIcon({
    className: `student-map-pin${active ? ' is-active' : ''}`,
    html: `<div class="student-map-pin__face">${face}</div>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE],
    popupAnchor: [0, -PIN_SIZE + 4],
  });
}

/** Brand cluster bubble; size step depends on how many people it holds. */
export function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 'sm' : count < 50 ? 'md' : 'lg';
  const px = { sm: 38, md: 46, lg: 56 }[size];
  return L.divIcon({
    className: `student-map-cluster student-map-cluster--${size}`,
    html: `<span>${count}</span>`,
    iconSize: [px, px],
  });
}
