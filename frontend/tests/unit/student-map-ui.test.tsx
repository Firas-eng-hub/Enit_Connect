import { describe, it, expect, vi } from 'vitest';
import L from 'leaflet';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { PersonPopup } from '@/features/student-map/ui/PersonPopup';
import {
  createClusterIcon,
  createCountIcon,
  createPersonIcon,
  escapeHtml,
  getInitials,
  markerPeople,
} from '@/features/student-map/ui/personIcon';
import { PeopleList } from '@/features/student-map/ui/PeopleList';
import { resolvePictureSrc } from '@/shared/lib/media';
import type { MapPerson } from '@/features/student-map/model/types';

const XSS_NAME = '<img src=x onerror=alert(1)> Evil';

const person: MapPerson = {
  id: 'abc-123',
  name: XSS_NAME,
  picture: null,
  type: 'Alumni',
  promotion: '2020',
  class: 'GI',
  workAt: 'Acme',
  city: 'Tunis',
  country: 'Tunisia',
  lat: 36.8,
  lng: 10.2,
};

describe('PersonPopup', () => {
  it('renders the name as text and links to the in-app profile', () => {
    const { container } = renderWithProviders(<PersonPopup person={person} />);

    expect(screen.getByText(XSS_NAME)).toBeInTheDocument();
    expect(container.querySelector('img[onerror]')).toBeNull();

    const link = screen.getByRole('link', { name: 'View profile' });
    expect(link).toHaveAttribute('href', '/user/student/abc-123');
    expect(link).not.toHaveAttribute('target');
    expect(screen.getByText('Works at Acme')).toBeInTheDocument();
    expect(screen.getByText('Tunis, Tunisia')).toBeInTheDocument();
  });
});

describe('personIcon', () => {
  it('escapes HTML and builds initials', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    expect(getInitials('amira ben ali')).toBe('AB');
    expect(getInitials('   ')).toBe('?');
  });

  it('never injects raw user content into the pin markup', () => {
    const icon = createPersonIcon(XSS_NAME, '" onerror="alert(1)', true);
    const html = String(icon.options.html);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('" onerror="');
    expect(icon.options.className).toContain('is-active');
  });
});

describe('cluster and cell icons', () => {
  it('sums people across cell markers instead of counting markers', () => {
    const a = L.marker([36.8, 10.2]);
    const b = L.marker([36.9, 10.1]);
    const c = L.marker([36.7, 10.3]);
    markerPeople.set(a, 1200);
    markerPeople.set(b, 30);
    // c has no recorded count: treated as one person
    const cluster = { getAllChildMarkers: () => [a, b, c] } as unknown as L.MarkerCluster;

    const html = String(createClusterIcon(cluster).options.html);
    expect(html).toContain('1.2k'); // 1231 people
  });

  it('renders count bubbles with size steps', () => {
    expect(createCountIcon(5).options.className).toContain('student-map-cluster--sm');
    expect(createCountIcon(500).options.className).toContain('student-map-cluster--md');
    expect(createCountIcon(50_000, true).options.className).toMatch(/--lg.*is-active/);
  });
});

describe('PeopleList', () => {
  it('offers "Load more" while pages remain', async () => {
    const onLoadMore = vi.fn();
    renderWithProviders(
      <PeopleList
        people={[person]}
        activeId={null}
        hasMore
        loadingMore={false}
        onLoadMore={onLoadMore}
        onHover={() => {}}
        onFocus={() => {}}
      />
    );
    screen.getByRole('button', { name: 'Load more' }).click();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state for an empty area', () => {
    renderWithProviders(
      <PeopleList people={[]} activeId={null} hasMore={false} loadingMore={false} onLoadMore={() => {}} onHover={() => {}} onFocus={() => {}} />
    );
    expect(screen.getByText(/No one in this area/)).toBeInTheDocument();
  });
});

describe('resolvePictureSrc', () => {
  it('normalises stored picture paths', () => {
    expect(resolvePictureSrc(null)).toBeNull();
    expect(resolvePictureSrc('  ')).toBeNull();
    expect(resolvePictureSrc('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolvePictureSrc('/uploads/a.png')).toMatch(/\/uploads\/a\.png$/);
    expect(resolvePictureSrc('uploads/a.png')).toMatch(/\/uploads\/a\.png$/);
    expect(resolvePictureSrc('http://localhost:3000/uploads/a.png')).toMatch(/\/uploads\/a\.png$/);
  });
});
