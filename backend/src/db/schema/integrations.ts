import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { clans } from './clans';

export const connectionStatusEnum = pgEnum('connection_status', [
  'active',
  'paused',
  'error',
  'revoked',
]);

export const eventDirectionEnum = pgEnum('event_direction', [
  'inbound',
  'outbound',
]);

export const eventStatusEnum = pgEnum('integration_event_status', [
  'success',
  'failed',
  'skipped',
]);

export const integrationProviders = pgTable('integration_providers', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  oauthAuthUrl: text('oauth_auth_url'),
  oauthTokenUrl: text('oauth_token_url'),
  requiredTier: text('required_tier').default('pro').notNull(),
  category: text('category').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const integrationConnections = pgTable(
  'integration_connections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').notNull().references(() => profiles.id),
    clanId: uuid('clan_id').references(() => clans.id),
    providerId: text('provider_id').notNull().references(() => integrationProviders.id),
    status: connectionStatusEnum('status').default('active').notNull(),
    encryptedAccessToken: text('encrypted_access_token'),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    providerConfig: jsonb('provider_config').$type<Record<string, unknown>>(),
    consecutiveFailures: integer('consecutive_failures').default(0).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('uq_profile_provider_clan').on(t.profileId, t.providerId, t.clanId)],
);

export const integrationEvents = pgTable('integration_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  connectionId: uuid('connection_id')
    .notNull()
    .references(() => integrationConnections.id, { onDelete: 'cascade' }),
  direction: eventDirectionEnum('direction').notNull(),
  eventType: text('event_type').notNull(),
  status: eventStatusEnum('status').notNull(),
  payload: jsonb('payload'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const integrationSyncState = pgTable('integration_sync_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  connectionId: uuid('connection_id')
    .notNull()
    .references(() => integrationConnections.id, { onDelete: 'cascade' }),
  resourceType: text('resource_type').notNull(),
  syncCursor: text('sync_cursor'),
  lastFullSyncAt: timestamp('last_full_sync_at', { withTimezone: true }),
  lastIncrementalAt: timestamp('last_incremental_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
});
