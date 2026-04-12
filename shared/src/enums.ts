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

export const SubscriptionTier = {
  FREE: 'free',
  ESSENTIALS: 'essentials',
  PRO: 'pro',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;
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
