import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

/**
 * Coverage for the authentication chokepoint. 139 route registrations depend
 * on this middleware and it had no tests before the Better Auth migration —
 * which is exactly the code you don't want to swap providers in blind.
 *
 * Each collaborator is mocked so the branches can be exercised without a
 * database, a Clerk instance, or a real session.
 */

const mocks = vi.hoisted(() => ({
  verifyKey: vi.fn(),
  verifyAccessToken: vi.fn(),
  getSession: vi.fn(),
  resolveProfileId: vi.fn(),
  provisionProfile: vi.fn(),
  verifyClerkToken: vi.fn(),
  env: {
    MCP_JWT_SECRET: 'test-mcp-secret',
    CLERK_SECRET_KEY: 'sk_test_legacy',
    NODE_ENV: 'test' as const,
  },
}));

vi.mock('../config/env.js', () => ({ env: mocks.env }));
vi.mock('../services/api-key.service.js', () => ({
  apiKeyService: { verifyKey: mocks.verifyKey },
}));
vi.mock('../services/oauth.service.js', () => ({
  oauthService: { verifyAccessToken: mocks.verifyAccessToken },
}));
vi.mock('../lib/auth.js', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('../plugins/auth.js', () => ({ resolveProfileId: mocks.resolveProfileId }));
vi.mock('../services/profile-provisioning.service.js', () => ({
  provisionProfile: mocks.provisionProfile,
}));
vi.mock('@clerk/fastify', () => ({ verifyToken: mocks.verifyClerkToken }));

const { requireAuth } = await import('./require-auth.js');

/** Minimal app that echoes whatever requireAuth resolved. */
async function buildApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest('authUserId', undefined);
  app.decorateRequest('clerkUserId', undefined);
  app.decorateRequest('profileId', undefined);
  app.decorateRequest('apiKeyId', undefined);
  app.decorateRequest('mcpScopes', undefined);
  app.decorateRequest('mcpClientId', undefined);
  app.decorateRequest('mcpClientName', undefined);

  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    return reply.status(status).send({ error: error.message });
  });

  app.get('/probe', { preHandler: [requireAuth] }, async (request) => ({
    profileId: request.profileId,
    authUserId: request.authUserId,
    clerkUserId: request.clerkUserId,
    apiKeyId: request.apiKeyId,
    mcpClientId: request.mcpClientId,
  }));

  await app.ready();
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.env.CLERK_SECRET_KEY = 'sk_test_legacy';
  mocks.env.MCP_JWT_SECRET = 'test-mcp-secret';
  mocks.getSession.mockResolvedValue(null);
});

describe('requireAuth', () => {
  it('rejects a request with no credentials at all', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/probe' });

    expect(res.statusCode).toBe(401);
    expect(mocks.getSession).toHaveBeenCalledOnce();
  });

  describe('API key branch', () => {
    it('resolves a ninja_live_ token without touching any other verifier', async () => {
      mocks.verifyKey.mockResolvedValue({ userId: 'profile-1', keyId: 'key-9' });
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer ninja_live_abc123' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ profileId: 'profile-1', apiKeyId: 'key-9' });
      // The whole point of ordering the branches: no session lookup, no Clerk.
      expect(mocks.getSession).not.toHaveBeenCalled();
      expect(mocks.verifyClerkToken).not.toHaveBeenCalled();
    });

    it('propagates a rejected key as an error rather than falling through', async () => {
      mocks.verifyKey.mockRejectedValue(
        Object.assign(new Error('Invalid API key'), { statusCode: 401 }),
      );
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer ninja_live_revoked' },
      });

      expect(res.statusCode).toBe(401);
      expect(mocks.getSession).not.toHaveBeenCalled();
    });
  });

  describe('MCP JWT branch', () => {
    it('resolves scopes and client identity from a valid MCP token', async () => {
      mocks.verifyAccessToken.mockReturnValue({
        sub: 'profile-2',
        scopes: ['read:boards'],
        aud: 'client-abc',
        client_name: 'Claude',
      });
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer header.payload.signature' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ profileId: 'profile-2', mcpClientId: 'client-abc' });
      expect(mocks.getSession).not.toHaveBeenCalled();
    });

    it('falls through to the session when the token is not an MCP JWT', async () => {
      mocks.verifyAccessToken.mockImplementation(() => {
        throw new Error('bad signature');
      });
      mocks.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.co', name: 'A' } });
      mocks.resolveProfileId.mockResolvedValue('profile-3');
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer not.an.mcptoken' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ profileId: 'profile-3' });
    });

    it('skips the MCP branch entirely when MCP_JWT_SECRET is unset', async () => {
      mocks.env.MCP_JWT_SECRET = '';
      const app = await buildApp();

      await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer a.b.c' },
      });

      expect(mocks.verifyAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('Better Auth session branch', () => {
    it('maps a session user to their profile', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'auth-user-1', email: 'ninja@kanninja.com', name: 'Ninja', image: null },
      });
      mocks.resolveProfileId.mockResolvedValue('profile-4');
      const app = await buildApp();

      const res = await app.inject({ method: 'GET', url: '/probe' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ profileId: 'profile-4', authUserId: 'auth-user-1' });
      expect(mocks.provisionProfile).not.toHaveBeenCalled();
    });

    it('provisions a profile on first sign-in for an imported user', async () => {
      mocks.getSession.mockResolvedValue({
        user: { id: 'auth-user-2', email: 'new@kanninja.com', name: 'New', image: null },
      });
      mocks.resolveProfileId.mockResolvedValue(null);
      mocks.provisionProfile.mockResolvedValue('profile-5');
      const app = await buildApp();

      const res = await app.inject({ method: 'GET', url: '/probe' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ profileId: 'profile-5' });
      expect(mocks.provisionProfile).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'auth-user-2', email: 'new@kanninja.com' }),
      );
    });
  });

  describe('legacy Clerk branch', () => {
    it('accepts a Clerk token for a user who already has a profile', async () => {
      mocks.verifyAccessToken.mockImplementation(() => {
        throw new Error('not mcp');
      });
      mocks.verifyClerkToken.mockResolvedValue({ sub: 'user_2clerk' });
      mocks.resolveProfileId.mockImplementation(async (key: { clerkUserId?: string }) =>
        key.clerkUserId === 'user_2clerk' ? 'profile-6' : null,
      );
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer clerk.jwt.token' },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ profileId: 'profile-6', clerkUserId: 'user_2clerk' });
    });

    it('rejects rather than forking data when a Clerk user has no profile', async () => {
      // Post-cutover signup, rolled back into. Creating a second profile here
      // would silently split the user's data across two identities.
      mocks.verifyAccessToken.mockImplementation(() => {
        throw new Error('not mcp');
      });
      mocks.verifyClerkToken.mockResolvedValue({ sub: 'user_2new' });
      mocks.resolveProfileId.mockResolvedValue(null);
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer clerk.jwt.token' },
      });

      expect(res.statusCode).toBe(401);
      expect(mocks.provisionProfile).not.toHaveBeenCalled();
    });

    it('is disabled by clearing CLERK_SECRET_KEY', async () => {
      mocks.env.CLERK_SECRET_KEY = '';
      mocks.verifyAccessToken.mockImplementation(() => {
        throw new Error('not mcp');
      });
      const app = await buildApp();

      const res = await app.inject({
        method: 'GET',
        url: '/probe',
        headers: { authorization: 'Bearer clerk.jwt.token' },
      });

      expect(res.statusCode).toBe(401);
      expect(mocks.verifyClerkToken).not.toHaveBeenCalled();
    });
  });
});
