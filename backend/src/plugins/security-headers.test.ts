import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { securityHeadersPlugin, HSTS } from './security-headers.js';

describe('securityHeadersPlugin', () => {
  it('sets HSTS and nosniff on every response, including errors', async () => {
    const app = Fastify({ logger: false });
    await app.register(securityHeadersPlugin);
    app.get('/ok', async () => ({ ok: true }));
    await app.ready();

    for (const url of ['/ok', '/missing']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.headers['strict-transport-security']).toBe(HSTS);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    }
  });
});
