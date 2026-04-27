import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

// Registered OAuth clients. Anthropic, OpenAI, etc. — and DCR-registered ones.
// Public clients only: PKCE is required, no client_secret.
export const oauthClients = pgTable(
  'oauth_clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: text('client_id').notNull().unique(),
    clientName: text('client_name').notNull(),
    redirectUris: text('redirect_uris').array().notNull(),
    isPublic: text('is_public').notNull().default('true'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    clientIdIdx: index('oauth_clients_client_id_idx').on(t.clientId),
  }),
);

// Authorization codes — short-lived (10 min), single-use.
// Created when a user consents at /authorize. Exchanged at /token.
export const oauthAuthorizationCodes = pgTable(
  'oauth_authorization_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    clientId: text('client_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    redirectUri: text('redirect_uri').notNull(),
    scopes: text('scopes').array().notNull(),
    codeChallenge: text('code_challenge').notNull(),
    codeChallengeMethod: text('code_challenge_method').notNull().default('S256'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: index('oauth_codes_code_idx').on(t.code),
  }),
);

// Refresh tokens — opaque, server-side. Revocable instantly by row delete.
// Access tokens are JWTs with a 5-min TTL; revocation is enforced by refusing
// to mint new access tokens for a refresh token whose row is gone.
export const oauthRefreshTokens = pgTable(
  'oauth_refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    clientId: text('client_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    scopes: text('scopes').array().notNull(),
    rotatedFromId: uuid('rotated_from_id'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tokenHashIdx: index('oauth_refresh_tokens_hash_idx').on(t.tokenHash),
    userIdIdx: index('oauth_refresh_tokens_user_idx').on(t.userId),
  }),
);

// Authorization request state — keyed by req_id, the handle mcp-remote passes
// to the consent UI. Stores the pending /authorize params until the user
// consents (or the row expires).
export const oauthAuthorizationRequests = pgTable(
  'oauth_authorization_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reqId: text('req_id').notNull().unique(),
    clientId: text('client_id').notNull(),
    redirectUri: text('redirect_uri').notNull(),
    scopes: text('scopes').array().notNull(),
    state: text('state').notNull(),
    codeChallenge: text('code_challenge').notNull(),
    codeChallengeMethod: text('code_challenge_method').notNull().default('S256'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    reqIdIdx: index('oauth_auth_requests_req_id_idx').on(t.reqId),
  }),
);
