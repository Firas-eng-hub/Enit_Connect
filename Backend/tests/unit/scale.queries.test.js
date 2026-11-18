/**
 * Scale guards: map/search SQL is parameterised and bounded, helpers behave,
 * and audience-wide notifications are a single INSERT ... SELECT.
 */
jest.mock('../../db', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));
jest.mock('../../helpers/sse.manager', () => ({ broadcastToType: jest.fn() }));

const db = require('../../db');
const sse = require('../../helpers/sse.manager');
const mapRepo = require('../../repositories/studentMap.repository');
const studentRepo = require('../../repositories/student.repository');
const companyRepo = require('../../repositories/company.repository');
const notificationRepo = require('../../repositories/notification.repository');
const { createTtlCache } = require('../../helpers/ttl-cache');
const { parseLimit, parseOffset } = require('../../utils/pagination');
const { escapeLike } = require('../../utils/sql');

const lastCall = () => db.query.mock.calls[db.query.mock.calls.length - 1];

beforeEach(() => {
  jest.clearAllMocks();
  db.query.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('utils', () => {
  it('parseLimit / parseOffset clamp client values', () => {
    expect(parseLimit('10', 50, 100)).toBe(10);
    expect(parseLimit('1000', 50, 100)).toBe(100);
    expect(parseLimit('0', 50, 100)).toBe(1);
    expect(parseLimit('abc', 50, 100)).toBe(50);
    expect(parseOffset('-5')).toBe(0);
    expect(parseOffset('9999999')).toBe(100000);
    expect(parseOffset(undefined)).toBe(0);
  });

  it('escapeLike neutralises wildcards', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('ttl cache expires and evicts', async () => {
    let now = 0;
    const cache = createTtlCache({ ttlMs: 100, maxEntries: 2, now: () => now });
    const compute = jest.fn(async () => 'v');
    await cache.wrap('a', compute);
    await cache.wrap('a', compute);
    expect(compute).toHaveBeenCalledTimes(1);
    now = 150;
    await cache.wrap('a', compute);
    expect(compute).toHaveBeenCalledTimes(2);
    cache.set('b', 1);
    cache.set('c', 2);
    expect(cache.size()).toBe(2);
    expect(cache.get('a')).toBeUndefined();
  });
});

describe('studentMap.repository', () => {
  it('buildMapWhere binds every user value as a parameter', () => {
    const params = [];
    const where = mapRepo.buildMapWhere(
      { property: 'city', key: "Tunis'; DROP TABLE students;--", type: 'Alumni', promotion: '2020', class: 'GI', employed: true },
      's',
      params
    );
    expect(where).not.toContain('DROP');
    expect(where).toContain("s.status = 'Active'");
    expect(where).toContain('s.lat_city IS NOT NULL');
    expect(params).toEqual(["Tunis'; DROP TABLE students;--%", 'Alumni', '2020', 'GI']);
  });

  it('ignores non-allowlisted search properties', () => {
    const params = [];
    const where = mapRepo.buildMapWhere({ property: 'password', key: 'x' }, 's', params);
    expect(where).not.toContain('password');
    expect(params).toEqual([]);
  });

  it('listCells maps single-person cells to a directory-safe person', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { lat: 36.8, lng: 10.2, count: 40, cell_label: 'Tunis', id: null },
        { lat: 48.9, lng: 2.4, count: 1, id: 'p1', firstname: 'Amira', lastname: 'B', work_at: 'Acme', lat_city: 48.9, lng_city: 2.4 },
      ],
    });
    const cells = await mapRepo.listCells({ property: 'firstname', key: '' });
    expect(cells[0]).toEqual({ lat: 36.8, lng: 10.2, count: 40, label: 'Tunis', person: null });
    expect(cells[1].person).toMatchObject({ id: 'p1', name: 'Amira B', workAt: 'Acme', lat: 48.9 });
    expect(Object.keys(cells[1].person)).not.toEqual(expect.arrayContaining(['email', 'phone', 'address']));
    expect(lastCall()[0]).toMatch(/GROUP BY s\.lat_city, s\.lng_city/);
  });

  it('listPeople uses keyset pagination and fetches one extra row', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 'a', firstname: 'A', lastname: 'X' },
        { id: 'b', firstname: 'B', lastname: 'Y' },
        { id: 'c', firstname: 'C', lastname: 'Z' },
      ],
    });
    const after = { lastname: 'w', firstname: 'w', id: '11111111-1111-4111-8111-111111111111' };
    const { people, next } = await mapRepo.listPeople({ property: 'firstname', key: '' }, { after, limit: 2 });
    const [sql, params] = lastCall();
    expect(sql).toMatch(/\(lower\(s\.lastname\), lower\(s\.firstname\), s\.id\) >/);
    expect(sql).toMatch(/ORDER BY lower\(s\.lastname\), lower\(s\.firstname\), s\.id/);
    expect(params.slice(-4)).toEqual(['w', 'w', after.id, 3]);
    expect(people.map((p) => p.id)).toEqual(['a', 'b']);
    expect(next).toEqual({ lastname: 'y', firstname: 'b', id: 'b' });
  });

  it('getStats runs bounded GROUP BY queries and shapes the result', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 120, countries: 4 }] })
      .mockResolvedValueOnce({ rows: [{ label: 'Tunis', count: 80 }] })
      .mockResolvedValueOnce({ rows: [{ label: 'Acme', count: 9 }] });

    const stats = await mapRepo.getStats({ property: 'firstname', key: '', type: 'Alumni' });

    expect(stats).toEqual({ total: 120, countries: 4, topCities: [{ label: 'Tunis', count: 80 }], topEmployers: [{ label: 'Acme', count: 9 }] });
    expect(db.query).toHaveBeenCalledTimes(3);
    db.query.mock.calls.slice(1).forEach(([sql]) => {
      expect(sql).toMatch(/GROUP BY lower\(btrim\(s\.(city|work_at)\)\)/);
      expect(sql).toMatch(/LIMIT 3/);
      expect(sql).not.toMatch(/mode\(\)/);
    });
  });

  it('listPeople handles a bbox across the antimeridian', async () => {
    await mapRepo.listPeople({ property: 'firstname' }, { bbox: { south: -10, north: 10, west: 170, east: -170 }, limit: 5 });
    expect(lastCall()[0]).toMatch(/\(s\.lng_city >= \$\d+ OR s\.lng_city <= \$\d+\)/);
  });
});

describe('search repositories are bounded and indexed', () => {
  it('student searchByKey selects explicit columns with LIMIT/OFFSET and escaped input', async () => {
    await studentRepo.searchByKey('firstname', '50%', { limit: 20, offset: 40, activeOnly: true });
    const [sql, params] = lastCall();
    expect(sql).not.toMatch(/SELECT \*/);
    expect(sql).not.toMatch(/password/);
    expect(sql).toMatch(/LIMIT \$2 OFFSET \$3/);
    expect(sql).toContain("status = 'Active'");
    expect(params).toEqual(['50\\%%', 20, 40]);
  });

  it('student searchByName uses pg_trgm in SQL with a limit', async () => {
    await studentRepo.searchByName(' Amira ', { limit: 7 });
    const [sql, params] = lastCall();
    expect(sql).toMatch(/% \$1 OR .* ILIKE \$2/s);
    expect(sql).toMatch(/ORDER BY similarity\(/);
    expect(params).toEqual(['Amira', '%Amira%', 7]);
  });

  it('student searchByFilters appends LIMIT/OFFSET after the filter params', async () => {
    await studentRepo.searchByFilters({ city: 'Tunis', className: 'GI' }, { limit: 10, offset: 0 });
    const [sql, params] = lastCall();
    expect(sql).toMatch(/LIMIT \$3 OFFSET \$4/);
    expect(params).toEqual(['%Tunis%', '%GI%', 10, 0]);
  });

  it('company listPage and searchByName are bounded', async () => {
    await companyRepo.listPage({ limit: 100, offset: 200 });
    expect(lastCall()[0]).toMatch(/LIMIT \$1 OFFSET \$2/);
    expect(lastCall()[1]).toEqual([100, 200]);
    await companyRepo.searchByName('Acme', { limit: 5 });
    expect(lastCall()[0]).toMatch(/name % \$1/);
  });
});

describe('notification broadcast', () => {
  it('inserts for the whole audience in one statement and prunes once', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
    client.query.mockResolvedValueOnce({}) // set_config
      .mockResolvedValueOnce({ rowCount: 190000 }) // INSERT ... SELECT
      .mockResolvedValueOnce({ rowCount: 12 }); // prune
    db.withTransaction.mockImplementation((fn) => fn(client));

    const inserted = await notificationRepo.broadcast({ recipientType: 'student', title: 'T', message: 'M' });

    expect(inserted).toBe(190000);
    expect(client.query).toHaveBeenCalledTimes(3);
    expect(client.query.mock.calls[0][0]).toMatch(/set_config\('app\.bulk_notify', 'on', true\)/);
    expect(client.query.mock.calls[1][0]).toMatch(/INSERT INTO notifications .*SELECT u\.id.*FROM students u/s);
    expect(client.query.mock.calls[2][0]).toMatch(/row_number\(\) OVER/);
    expect(db.query).not.toHaveBeenCalled(); // nothing per recipient
    expect(sse.broadcastToType).toHaveBeenCalledWith('student', 'notification', expect.objectContaining({ title: 'T' }));
  });

  it('rejects unknown audiences instead of interpolating them', async () => {
    await expect(notificationRepo.broadcast({ recipientType: 'admins; DROP', title: 'T', message: 'M' })).rejects.toThrow(
      /Unsupported broadcast audience/
    );
    await expect(notificationRepo.broadcast({ recipientType: '__proto__', title: 'T', message: 'M' })).rejects.toThrow();
    expect(db.withTransaction).not.toHaveBeenCalled();
  });
});
