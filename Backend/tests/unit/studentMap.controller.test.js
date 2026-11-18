/**
 * Student network map: privacy of GET /api/student/location.
 * Coordinates come from home addresses, so the endpoint must only expose
 * city-level positions of active students and directory-safe fields.
 */
const express = require('express');
const request = require('supertest');

const mockStudentRepository = {
  listAll: jest.fn(),
  searchByKey: jest.fn(),
};

jest.mock('../../repositories', () => ({ studentRepository: mockStudentRepository }));

const controller = require('../../controllers/studentMap.controller');
const { snapCoord, isValidLatLng } = require('../../utils/geo');

const row = (overrides = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  firstname: 'Amira',
  lastname: 'Ben Ali',
  email: 'amira@example.com',
  phone: '+216 00 000 000',
  address: '12 Rue Secrète, Tunis',
  password: 'hash',
  status: 'Active',
  type: 'Alumni',
  promotion: '2021',
  class: 'GI',
  work_at: 'Acme',
  city: 'Tunis',
  country: 'Tunisia',
  picture: '/uploads/a.png',
  latitude: '36.80649',
  longitude: '10.18153',
  ...overrides,
});

const buildApp = () => {
  const app = express();
  app.get('/api/student/location', controller.getStudentLocations);
  return app;
};

describe('utils/geo', () => {
  it('snaps coordinates to one decimal place', () => {
    expect(snapCoord('36.80649')).toBe(36.8);
    expect(snapCoord(10.18153)).toBe(10.2);
    expect(snapCoord(-33.86)).toBe(-33.9);
  });

  it('rejects missing or non-numeric values', () => {
    expect(snapCoord(null)).toBeNull();
    expect(snapCoord('')).toBeNull();
    expect(snapCoord('abc')).toBeNull();
  });

  it('validates lat/lng ranges', () => {
    expect(isValidLatLng(36.8, 10.2)).toBe(true);
    expect(isValidLatLng(null, 10.2)).toBe(false);
    expect(isValidLatLng(91, 10)).toBe(false);
  });
});

describe('GET /api/student/location', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns city-level coordinates and directory-safe fields only', async () => {
    mockStudentRepository.listAll.mockResolvedValue([row()]);

    const res = await request(buildApp()).get('/api/student/location?property=firstname&key=');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Amira Ben Ali',
        picture: '/uploads/a.png',
        type: 'Alumni',
        promotion: '2021',
        class: 'GI',
        workAt: 'Acme',
        city: 'Tunis',
        country: 'Tunisia',
        lat: 36.8,
        lng: 10.2,
      },
    ]);
    const serialized = JSON.stringify(res.body);
    ['amira@example.com', '+216', 'Rue Secrète', '36.80649', 'hash'].forEach((secret) => {
      expect(serialized).not.toContain(secret);
    });
  });

  it('excludes non-active students and rows without usable coordinates', async () => {
    mockStudentRepository.listAll.mockResolvedValue([
      row({ id: 'a', status: 'Pending' }),
      row({ id: 'b', latitude: null }),
      row({ id: 'c', longitude: 'not-a-number' }),
      row({ id: 'd' }),
    ]);

    const res = await request(buildApp()).get('/api/student/location?property=firstname');

    expect(res.status).toBe(200);
    expect(res.body.map((p) => p.id)).toEqual(['d']);
  });

  it('searches by an allowlisted column when a key is given', async () => {
    mockStudentRepository.searchByKey.mockResolvedValue([row()]);

    const res = await request(buildApp()).get('/api/student/location?property=class&key=GI');

    expect(res.status).toBe(200);
    expect(mockStudentRepository.searchByKey).toHaveBeenCalledWith('"class"', 'GI');
  });

  it('rejects non-allowlisted properties', async () => {
    const res = await request(buildApp()).get('/api/student/location?property=email&key=x');

    expect(res.status).toBe(400);
    expect(mockStudentRepository.searchByKey).not.toHaveBeenCalled();
  });

  it('hides database errors behind a generic 500', async () => {
    mockStudentRepository.listAll.mockRejectedValue(new Error('db exploded: secret detail'));

    const res = await request(buildApp()).get('/api/student/location?property=firstname');

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret detail');
  });
});
