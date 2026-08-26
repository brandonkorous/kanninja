export const BoardRole = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;
export type BoardRole = (typeof BoardRole)[keyof typeof BoardRole];

export const ClanRole = {
  ADMIN: 'admin',
  MEMBER: 'member',
  READER: 'reader',
} as const;
export type ClanRole = (typeof ClanRole)[keyof typeof ClanRole];

export const Priority = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const AuditActionType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  INVITE: 'invite',
  JOIN: 'join',
  EXPORT: 'export',
  IMPORT: 'import',
  SETTINGS_CHANGE: 'settings_change',
  PERMISSION_CHANGE: 'permission_change',
} as const;
export type AuditActionType = (typeof AuditActionType)[keyof typeof AuditActionType];

/**
 * Two tiers, deliberately.
 *
 * Pro, Business and Enterprise were retired: of the eight things the five-tier
 * grid advertised, only seats and MCP rate limit were ever enforced in code —
 * SSO/SCIM did not exist at all. Enterprise is absent rather than renamed
 * because it implies SOC 2, and that is a cost worth paying when a customer
 * asks for it, not before.
 *
 * The paid tier is CLAN, not Pro. A clan is already the unit of work in this
 * product — a real table, a real membership — and it is what a seat is bought
 * for. "Pro" would have been the one piece of generic SaaS vocabulary in a
 * product that renames boards to dojos.
 *
 * Note the collision: `clan` is also a domain object. User-facing billing copy
 * says "the Clan plan", never bare "Clan", so "upgrade your clan to Clan" never
 * has to be written.
 *
 * The column is TEXT, so retired values still sit in old rows — including the
 * `pro` subscriptions sold before this change. Route reads through
 * normalizeTier() in pricing.ts rather than indexing the tier table directly.
 */
export const SubscriptionTier = {
  FREE: 'free',
  CLAN: 'clan',
} as const;

/** Tier strings that may exist in the database but are no longer sold. */
export const RETIRED_TIERS = ['pro', 'business', 'enterprise'] as const;
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const CustomFieldType = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  CHECKBOX: 'checkbox',
} as const;
export type CustomFieldType = (typeof CustomFieldType)[keyof typeof CustomFieldType];
