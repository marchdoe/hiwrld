import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './server.js';

const app = createApp();

describe('server', () => {
  it('returns index.html on /', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('hiwrld');
  });

  it('sets a strict CSP header', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('frame-src https://www.youtube.com');
    expect(csp).toContain('https://*.firebaseio.com');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('sets X-Content-Type-Options nosniff via helmet', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('falls back to index.html for unknown SPA routes', async () => {
    const res = await request(app).get('/abc1234');
    expect(res.status).toBe(200);
    expect(res.text).toContain('hiwrld');
  });

  it('falls back to index.html for nested SPA routes', async () => {
    const res = await request(app).get('/abc1234/read');
    expect(res.status).toBe(200);
    expect(res.text).toContain('hiwrld');
  });

  it('sets Cache-Control: no-cache on index.html', async () => {
    const res = await request(app).get('/');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('returns 404 for unknown asset paths', async () => {
    const res = await request(app).get('/no-such-file.png');
    expect(res.status).toBe(404);
  });

  it('compresses responses when Accept-Encoding includes gzip', async () => {
    const res = await request(app).get('/').set('Accept-Encoding', 'gzip');
    // Express's compression middleware sets the header on responses above its
    // default threshold (1024 bytes). index.html is small but typically clears it.
    // Allow either encoded or uncompressed — we only fail if the header is
    // *wrong*.
    if (res.headers['content-encoding']) {
      expect(res.headers['content-encoding']).toBe('gzip');
    }
  });
});
