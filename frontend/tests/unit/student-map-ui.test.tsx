import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { PersonPopup } from '@/features/student-map/ui/PersonPopup';
import { createPersonIcon, escapeHtml, getInitials } from '@/features/student-map/ui/personIcon';
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
