import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { oauthService } from '../../services/oauth.service.js';
import { AppError } from '../../utils/errors.js';

const SUPPORTED_SCOPES = [
  'read:boards',
  'write:tasks',
  'ai:capabilities',
  'team:read',
  'integrations:read',
] as const;

/**
 * Verify the inbound request carries the shared service-to-service token. Used
 * by mcp-remote's protocol shim — every internal-only OAuth endpoint requires
 * it. Routes Clerk users hit (consent UI) use requireAuth instead.
 */
function requireS2S(token: string | undefined): void {
  if (!env.MCP_S2S_TOKEN) {
    throw AppError.unauthorized('S2S not configured');
  }
  if (!token || token !== env.MCP_S2S_TOKEN) {
    throw AppError.unauthorized('Invalid S2S token');
  }
}

function s2sFromHeader(authHeader: string | undefined): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  return authHeader.slice(7);
}

const registerClientSchema = z.object({
  client_name: z.string().min(1).max(200),
  redirect_uris: z.array(z.string().url()).min(1).max(20),
});

const authRequestSchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scopes: z.array(z.string()).min(1),
  state: z.string().min(1),
  code_challenge: z.string().min(1),
  code_challenge_method: z.literal('S256'),
});

const consentSchema = z.object({
  action: z.enum(['allow', 'deny']),
  granted_scopes: z.array(z.string()).optional(),
});

const tokenSchema = z.discriminatedUnion('grant_type', [
  z.object({
    grant_type: z.literal('authorization_code'),
    code: z.string().min(1),
    client_id: z.string().min(1),
    redirect_uri: z.string().url(),
    code_verifier: z.string().min(1),
  }),
  z.object({
    grant_type: z.literal('refresh_token'),
    refresh_token: z.string().min(1),
    client_id: z.string().min(1),
  }),
]);

export async function oauthRoutes(fastify: FastifyInstance) {
  // ---- S2S endpoints (called by mcp-remote) ----

  // DCR: register a public client. mcp-remote /register forwards to here.
  fastify.post('/api/v1/oauth/clients', async (request, _reply) => {
    requireS2S(s2sFromHeader(request.headers.authorization));
    const body = registerClientSchema.parse(request.body);
    const client = await oauthService.upsertPublicClient({
      clientName: body.client_name,
      redirectUris: body.redirect_uris,
    });
    return {
      client_id: client.clientId,
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
    };
  });

  // mcp-remote /authorize forwards here to create the request, then redirects
  // the browser to the frontend consent page using the returned reqId.
  fastify.post('/api/v1/oauth/auth-requests', async (request) => {
    requireS2S(s2sFromHeader(request.headers.authorization));
    const body = authRequestSchema.parse(request.body);

    const client = await oauthService.getClient(body.client_id);
    if (!client) throw AppError.unauthorized('Unknown client');
    if (!client.redirectUris.includes(body.redirect_uri)) {
      throw AppError.unauthorized('Redirect URI not registered for this client');
    }

    const unknown = body.scopes.filter((s) => !SUPPORTED_SCOPES.includes(s as typeof SUPPORTED_SCOPES[number]));
    if (unknown.length > 0) {
      throw AppError.validationError(`Unknown scopes: ${unknown.join(', ')}`);
    }

    const req = await oauthService.createAuthorizationRequest({
      clientId: body.client_id,
      redirectUri: body.redirect_uri,
      scopes: body.scopes,
      state: body.state,
      codeChallenge: body.code_challenge,
      codeChallengeMethod: body.code_challenge_method,
    });

    return { req_id: req.reqId, expires_at: req.expiresAt };
  });

  // mcp-remote /token forwards here. The actual code/refresh exchange lives
  // server-side because that's where the DB and JWT secret are.
  fastify.post('/api/v1/oauth/token', async (request) => {
    requireS2S(s2sFromHeader(request.headers.authorization));
    const body = tokenSchema.parse(request.body);

    if (body.grant_type === 'authorization_code') {
      return oauthService.exchangeAuthorizationCode({
        code: body.code,
        clientId: body.client_id,
        redirectUri: body.redirect_uri,
        codeVerifier: body.code_verifier,
      });
    }
    return oauthService.refresh({
      refreshToken: body.refresh_token,
      clientId: body.client_id,
    });
  });

  // ---- Clerk-authed endpoints (called by frontend consent page) ----

  // Read the request details so the consent UI can render "{ClientName} wants
  // access to {scopes}". reqId is unguessable so this leaks nothing if hit.
  fastify.get<{ Params: { reqId: string } }>(
    '/api/v1/oauth/auth-requests/:reqId',
    {
      preHandler: requireAuth,
    },
    async (request) => {
      const { reqId } = request.params;
      const authReq = await oauthService.getAuthorizationRequest(reqId);
      if (!authReq) throw AppError.notFound('Authorization request');

      const client = await oauthService.getClient(authReq.clientId);
      if (!client) throw AppError.notFound('Client');

      return {
        req_id: authReq.reqId,
        client: {
          client_id: client.clientId,
          client_name: client.clientName,
        },
        redirect_uri: authReq.redirectUri,
        scopes: authReq.scopes,
        expires_at: authReq.expiresAt,
      };
    },
  );

  // User clicks Allow/Deny. We issue the auth code (allow) or build the
  // error redirect (deny) and return the URL the browser should bounce to.
  fastify.post<{ Params: { reqId: string } }>(
    '/api/v1/oauth/auth-requests/:reqId/consent',
    {
      preHandler: requireAuth,
    },
    async (request) => {
      if (!request.profileId) throw AppError.unauthorized('Authentication required');
      const { reqId } = request.params;
      const body = consentSchema.parse(request.body);

      const authReq = await oauthService.getAuthorizationRequest(reqId);
      if (!authReq) throw AppError.notFound('Authorization request');

      const target = new URL(authReq.redirectUri);
      target.searchParams.set('state', authReq.state);

      if (body.action === 'deny') {
        target.searchParams.set('error', 'access_denied');
        return { redirect_url: target.toString() };
      }

      const granted =
        body.granted_scopes && body.granted_scopes.length > 0
          ? body.granted_scopes.filter((s) => authReq.scopes.includes(s))
          : authReq.scopes;

      const result = await oauthService.issueAuthorizationCode({
        reqId,
        userId: request.profileId,
        grantedScopes: granted,
      });

      target.searchParams.set('code', result.code);
      return { redirect_url: target.toString() };
    },
  );

  // ---- Connected agents (Settings → Connected Agents) ----

  fastify.get('/api/v1/oauth/grants', { preHandler: requireAuth }, async (request) => {
    if (!request.profileId) throw AppError.unauthorized('Authentication required');
    const grants = await oauthService.listActiveGrants(request.profileId);
    return {
      data: grants.map((g) => ({
        client_id: g.clientId,
        client_name: g.clientName ?? 'Unknown agent',
        scopes: g.scopes,
        authorized_at: g.authorizedAt,
      })),
    };
  });

  fastify.delete<{ Params: { clientId: string } }>(
    '/api/v1/oauth/grants/:clientId',
    { preHandler: requireAuth },
    async (request) => {
      if (!request.profileId) throw AppError.unauthorized('Authentication required');
      const result = await oauthService.revokeGrant(request.profileId, request.params.clientId);
      return { data: result };
    },
  );
}
