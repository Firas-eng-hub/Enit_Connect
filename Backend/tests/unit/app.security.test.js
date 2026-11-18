/**
 * App-level wiring (real app.js): old document versions are never served statically.
 * No database is needed: these requests are answered before any repository call.
 */
const fs = require('fs');
const path = require('path');
const request = require('supertest');

// ESM-only dependency that Jest's CommonJS runtime cannot load; not used by these requests.
jest.mock('archiver', () => jest.fn());

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://test:test@127.0.0.1:1/test';

const app = require('../../app');

const VERSIONS_DIR = path.join(__dirname, '..', '..', 'uploads', 'versions');
const LEGACY_FILE = `jest-doc-${Date.now()}-v1.pdf`;
const PUBLIC_FILE = `jest-file-${Date.now()}.pdf`;

describe('app security wiring', () => {
  beforeAll(() => {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    fs.writeFileSync(path.join(VERSIONS_DIR, LEGACY_FILE), '%PDF-1.4 old version');
    fs.writeFileSync(path.join(VERSIONS_DIR, '..', PUBLIC_FILE), '%PDF-1.4 current');
  });

  afterAll(() => {
    fs.rmSync(path.join(VERSIONS_DIR, LEGACY_FILE), { force: true });
    fs.rmSync(path.join(VERSIONS_DIR, '..', PUBLIC_FILE), { force: true });
  });

  describe('legacy version files are not served statically', () => {
    it('still serves regular uploads, with the sandbox headers', async () => {
      const res = await request(app).get(`/uploads/${PUBLIC_FILE}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-security-policy']).toContain('sandbox');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it.each([
      `/uploads/versions/${LEGACY_FILE}`,
      `/uploads/%76ersions/${LEGACY_FILE}`,
      `/uploads/VERSIONS/${LEGACY_FILE}`,
      `/uploads//versions/${LEGACY_FILE}`,
      `/uploads/./versions/${LEGACY_FILE}`,
      `/uploads/x/../versions/${LEGACY_FILE}`,
      `/uploads/x/%2e%2e/versions/${LEGACY_FILE}`,
    ])('GET %s -> 404', async (url) => {
      const res = await request(app).get(url);
      expect(res.status).toBe(404);
      expect(res.text).not.toContain('old version');
    });
  });
});
