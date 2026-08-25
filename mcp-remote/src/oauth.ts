import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from './config/env.js';
import { s2sCall } from './backend-client.js';

const SUPPORTED_RESPONSE_TYPES = ['code'];
const SUPPORTED_GRANT_TYPES = ['authorization_code', 'refresh_token'];
// What we publish in discovery. New clients register against this list, so a
// retired scope must not appear here.
//
// Validation lives in the backend (routes/oauth/index.ts), which accepts a
// superset: `ai:capabilities` is a retired no-op — kanNINJA ships no AI of its
// own — but clients that registered before the removal have it cached and would
// fail re-authorization if it were rejected. Accepted there, never advertised here.
const ADVERTISED_SCOPES = [
  'read:boards',
  'write:tasks',
  'team:read',
  'integrations:read',
];

const authorizeQuerySchema = z.object({
  response_type: z.string(),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  state: z.string().min(1),
  scope: z.string().optional(),
  code_challenge: z.string().min(1),
  code_challenge_method: z.string(),
});

const registerBodySchema = z.object({
  client_name: z.string().min(1).max(200),
  redirect_uris: z.array(z.string().url()).min(1).max(20),
  // Tolerate extra DCR-spec fields without rejecting (token_endpoint_auth_method, etc.)
  // — clients send a kitchen sink and we only care about a subset.
}).passthrough();

const tokenBodySchema = z.discriminatedUnion('grant_type', [
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

function authorizeError(
  redirectUri: string,
  state: string | undefined,
  error: string,
  description?: string,
): URL {
  const url = new URL(redirectUri);
  url.searchParams.set('error', error);
  if (description) url.searchParams.set('error_description', description);
  if (state) url.searchParams.set('state', state);
  return url;
}

export async function oauthRoutes(fastify: FastifyInstance) {
  // RFC 8414 — OAuth 2.0 Authorization Server Metadata.
  // Anthropic's MCP discovery starts here.
  fastify.get('/.well-known/oauth-authorization-server', async () => {
    return {
      issuer: env.MCP_PUBLIC_URL,
      authorization_endpoint: `${env.MCP_PUBLIC_URL}/authorize`,
      token_endpoint: `${env.MCP_PUBLIC_URL}/token`,
      registration_endpoint: `${env.MCP_PUBLIC_URL}/register`,
      response_types_supported: SUPPORTED_RESPONSE_TYPES,
      grant_types_supported: SUPPORTED_GRANT_TYPES,
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: ADVERTISED_SCOPES,
    };
  });

  // RFC 9728 — OAuth 2.0 Protected Resource Metadata. MCP spec uses this for
  // discovery from the resource server's perspective.
  fastify.get('/.well-known/oauth-protected-resource', async () => {
    return {
      resource: env.MCP_PUBLIC_URL,
      authorization_servers: [env.MCP_PUBLIC_URL],
      scopes_supported: ADVERTISED_SCOPES,
      bearer_methods_supported: ['header'],
    };
  });

  // RFC 7591 — Dynamic Client Registration.
  // Public clients only (PKCE). Returns a client_id with no secret.
  fastify.post('/register', async (request, reply) => {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_client_metadata',
        error_description: parsed.error.errors[0]?.message,
      });
    }
    const result = await s2sCall<{ client_id: string; client_name: string; redirect_uris: string[] }>(
      '/api/v1/oauth/clients',
      {
        method: 'POST',
        body: {
          client_name: parsed.data.client_name,
          redirect_uris: parsed.data.redirect_uris,
        },
      },
    );
    if (!result.ok) {
      return reply.code(result.status).send(result.error);
    }
    return reply.code(201).send({
      client_id: result.data.client_id,
      client_name: result.data.client_name,
      redirect_uris: result.data.redirect_uris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    });
  });

  // /authorize — validates the inbound params, creates an auth request server-
  // side via S2S, then 302s the browser to the Clerk-protected consent page
  // with the req_id. mcp-remote never sees a Clerk session — it only learns
  // about the user when the consent UI calls back into the backend.
  fastify.get('/authorize', async (request, reply) => {
    const query = authorizeQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: query.error.errors[0]?.message,
      });
    }

    if (query.data.response_type !== 'code') {
      const url = authorizeError(
        query.data.redirect_uri,
        query.data.state,
        'unsupported_response_type',
      );
      return reply.redirect(url.toString());
    }

    if (query.data.code_challenge_method !== 'S256') {
      const url = authorizeError(
        query.data.redirect_uri,
        query.data.state,
        'invalid_request',
        'code_challenge_method must be S256',
      );
      return reply.redirect(url.toString());
    }

    const requestedScopes = query.data.scope
      ? query.data.scope.split(/\s+/).filter(Boolean)
      : ['read:boards', 'write:tasks'];

    const result = await s2sCall<{ req_id: string; expires_at: string }>(
      '/api/v1/oauth/auth-requests',
      {
        method: 'POST',
        body: {
          client_id: query.data.client_id,
          redirect_uri: query.data.redirect_uri,
          scopes: requestedScopes,
          state: query.data.state,
          code_challenge: query.data.code_challenge,
          code_challenge_method: 'S256',
        },
      },
    );

    if (!result.ok) {
      const url = authorizeError(
        query.data.redirect_uri,
        query.data.state,
        result.status === 401 ? 'unauthorized_client' : 'invalid_request',
        typeof result.error === 'object' && result.error && 'message' in result.error
          ? String((result.error as { message: unknown }).message)
          : undefined,
      );
      return reply.redirect(url.toString());
    }

    const consentUrl = new URL(env.CONSENT_BASE_URL);
    consentUrl.searchParams.set('req_id', result.data.req_id);
    return reply.redirect(consentUrl.toString());
  });

  // /token — pure proxy. Backend does the PKCE check, code consumption, refresh
  // rotation, and JWT signing. Body may be JSON or form-encoded — Fastify
  // parses both transparently because @fastify/formbody is registered in the
  // entry point.
  fastify.post('/token', async (request, reply) => {
    const parsed = tokenBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_request',
        error_description: parsed.error.errors[0]?.message,
      });
    }

    const result = await s2sCall<{
      access_token: string;
      token_type: 'Bearer';
      expires_in: number;
      refresh_token: string;
      scope: string;
    }>('/api/v1/oauth/token', { method: 'POST', body: parsed.data });

    if (!result.ok) {
      return reply.code(result.status).send(
        typeof result.error === 'object' && result.error
          ? result.error
          : { error: 'invalid_grant' },
      );
    }

    reply.header('Cache-Control', 'no-store');
    return result.data;
  });
}
