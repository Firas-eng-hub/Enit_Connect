/**
 * Student network map endpoints (/api/student/map/*): validation, keyset
 * cursors, caching and privacy of the payloads.
 */
const express = require('express');
const request = require('supertest');

const mockMapRepository = {
  listCells: jest.fn(),
  listPeople: jest.fn(),
  getStats: jest.fn(),
  getFilterOptions: jest.fn(),
};

jest.mock('../../repositories', () => ({ studentMapRepository: mockMapRepository }));

const validation = require('../../middlewares/validation');
const controller = require('../../controllers/studentMap.controller');

const { encodeCursor, decodeCursor, parseBbox, statsCache } = controller._internals;
const ID = '11111111-1111-4111-8111-111111111111';

const buildApp = () => {
  const app = express();
  const guard = validation.validate(validation.schemas.studentMapQuery, 'query');
  app.get('/cells', guard, controller.getCells);
  app.get('/people', guard, controller.getPeople);
  app.get('/stats', guard, controller.getStats);
  return app;
};

beforeEach(() => {
  jest.clearAllMocks();
  statsCache.clear();
});

describe('cursor and bbox parsing', () => {
  it('round-trips a keyset cursor', () => {
    const next = { lastname: 'ben ali', firstname: 'amira', id: ID };
    expect(decodeCursor(encodeCursor(next))).toEqual(next);
    expect(encodeCursor(null)).toBeNull();
  });

  it('rejects tampered cursors', () => {
    const b64 = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
    expect(decodeCursor(b64([1, 2, 3]))).toBeUndefined();
    expect(decodeCursor(b64(['a', 'b', 'not-a-uuid']))).toBeUndefined();
    expect(decodeCursor(b64(['a'.repeat(201), 'b', ID]))).toBeUndefined();
    expect(decodeCursor('%%%')).toBeUndefined();
  });

  it('validates bbox ranges', () => {
    expect(parseBbox('30,7,38,12')).toEqual({ south: 30, west: 7, north: 38, east: 12 });
    expect(parseBbox('38,7,30,12')).toBeUndefined(); // south > north
    expect(parseBbox('30,7,95,12')).toBeUndefined();
    expect(parseBbox(undefined)).toBeNull();
  });
});

describe('GET cells', () => {
  it('passes validated filters to the repository', async () => {
    mockMapRepository.listCells.mockResolvedValue([{ lat: 36.8, lng: 10.2, count: 3, person: null }]);

    const res = await request(buildApp()).get('/cells?property=city&key=Tunis&type=Alumni&employed=true');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(mockMapRepository.listCells).toHaveBeenCalledWith(
      expect.objectContaining({ property: 'city', key: 'Tunis', type: 'Alumni', employed: true })
    );
  });

  it('rejects non-allowlisted search properties and bad types', async () => {
    expect((await request(buildApp()).get('/cells?property=email&key=x')).status).toBe(400);
    expect((await request(buildApp()).get('/cells?type=Admin')).status).toBe(400);
    expect(mockMapRepository.listCells).not.toHaveBeenCalled();
  });

  it('hides database errors behind a generic 500', async () => {
    mockMapRepository.listCells.mockRejectedValue(new Error('db exploded: secret detail'));
    const res = await request(buildApp()).get('/cells');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret detail');
  });
});

describe('GET people', () => {
  it('returns a page and an opaque next cursor', async () => {
    mockMapRepository.listPeople.mockResolvedValue({
      people: [{ id: ID, name: 'Amira Ben Ali' }],
      next: { lastname: 'ben ali', firstname: 'amira', id: ID },
    });

    const res = await request(buildApp()).get('/people?bbox=30,7,38,12&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(decodeCursor(res.body.nextCursor)).toEqual({ lastname: 'ben ali', firstname: 'amira', id: ID });
    expect(mockMapRepository.listPeople).toHaveBeenCalledWith(expect.any(Object), {
      bbox: { south: 30, west: 7, north: 38, east: 12 },
      cell: null,
      after: null,
      limit: 10,
    });
  });

  it('clamps the page size via validation', async () => {
    const res = await request(buildApp()).get('/people?limit=500');
    expect(res.status).toBe(400);
  });

  it('rejects malformed bbox, cell and cursor values', async () => {
    const badCursor = Buffer.from(JSON.stringify(['x', 'y', 'drop table'])).toString('base64url');
    for (const qs of ['bbox=38,7,30,12', 'cell=95,10', `cursor=${badCursor}`, 'bbox=1,2;3']) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(buildApp()).get(`/people?${qs}`);
      expect(res.status).toBe(400);
    }
    expect(mockMapRepository.listPeople).not.toHaveBeenCalled();
  });
});

describe('GET stats', () => {
  it('caches stats and options per filter set', async () => {
    mockMapRepository.getStats.mockResolvedValue({ total: 5, countries: 1, topCities: [], topEmployers: [] });
    mockMapRepository.getFilterOptions.mockResolvedValue({ promotions: ['2024'], classes: ['GI'] });

    const first = await request(buildApp()).get('/stats?type=Student');
    const second = await request(buildApp()).get('/stats?type=Student');
    await request(buildApp()).get('/stats?type=Alumni');

    expect(first.body).toEqual({
      stats: { total: 5, countries: 1, topCities: [], topEmployers: [] },
      options: { promotions: ['2024'], classes: ['GI'] },
    });
    expect(second.body).toEqual(first.body);
    // Stats: one call per distinct filter set; options only depend on the search.
    expect(mockMapRepository.getStats).toHaveBeenCalledTimes(2);
    expect(mockMapRepository.getFilterOptions).toHaveBeenCalledTimes(1);
  });
});
