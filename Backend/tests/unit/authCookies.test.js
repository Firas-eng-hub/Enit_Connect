/**
 * Auth cookie clearing: the deletion cookie must carry the same attributes as the auth cookie,
 * otherwise browsers keep the SameSite=None session cookie after logout.
 */
const express = require('express');
const request = require('supertest');

jest.mock('../../repositories', () => ({}));

const loadAuthJwt = (env) => {
  const saved = {};
  Object.keys(env).forEach((key) => {
    saved[key] = process.env[key];
    process.env[key] = env[key];
  });
  let mod;
  jest.isolateModules(() => {
    mod = require('../../middlewares/authJwt');
  });
  Object.keys(saved).forEach((key) => {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  });
  return mod;
};

const getCookies = async (handler) => {
  const app = express();
  app.get('/t', (req, res) => {
    handler(res);
    res.status(200).end();
  });
  const res = await request(app).get('/t');
  return res.headers['set-cookie'] || [];
};

describe('authJwt cookies', () => {
  const env = {
    JWT_SECRET: 'f'.repeat(16) + 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    COOKIE_SECURE: 'true',
    COOKIE_SAMESITE: 'none',
    COOKIE_DOMAIN: 'example.com',
  };

  it('clears every auth cookie with the attributes it was set with', async () => {
    const authJwt = loadAuthJwt(env);
    const setCookies = await getCookies((res) => authJwt.setAuthCookies(res, 'a', 'r', 'student'));
    const clearCookies = await getCookies((res) => authJwt.clearAuthCookies(res));

    expect(clearCookies).toHaveLength(3);
    ['accessToken', 'refreshToken', 'userType'].forEach((name) => {
      const set = setCookies.find((c) => c.startsWith(`${name}=`));
      const cleared = clearCookies.find((c) => c.startsWith(`${name}=;`));
      expect(set).toBeDefined();
      expect(cleared).toBeDefined();
      ['Domain=example.com', 'Path=/', 'HttpOnly', 'Secure', 'SameSite=None'].forEach((attr) => {
        expect(set).toContain(attr);
        expect(cleared).toContain(attr);
      });
      expect(cleared).toContain('Expires=Thu, 01 Jan 1970');
      expect(cleared).not.toContain('Max-Age');
    });
  });

  it('defaults to SameSite=Lax without Secure/Domain when not configured', async () => {
    const authJwt = loadAuthJwt({ JWT_SECRET: env.JWT_SECRET, COOKIE_SECURE: '', COOKIE_SAMESITE: '', COOKIE_DOMAIN: '' });
    const clearCookies = await getCookies((res) => authJwt.clearAuthCookies(res));
    clearCookies.forEach((cookie) => {
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain('Secure');
      expect(cookie).not.toContain('Domain=');
    });
  });
});
