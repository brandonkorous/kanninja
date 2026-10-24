import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { securityHeadersPlugin } from './security-headers.js';

describe('securityHeadersPlugin', () => {
  it('sets nosniff on every response, including errors', async () => {
    const app = Fastify({ logger: false });
    await app.register(securityHeadersPlugin);
    app.get('/ok', async () => ({ ok: true }));
    await app.ready();

    for (const url of ['/ok', '/missing']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    }
  });
});
