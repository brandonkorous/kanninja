import { SubscriptionTier } from './enums.js';

export interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  price: { monthly: number; yearly: number };
  maxUsers: number;
  features: {
    aiFeatures: boolean;
    projectTemplates: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    ssoScim: boolean;
    auditLogs: boolean;
    fileStorage: string;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.FREE]: {
    name: 'Starter',
    tier: SubscriptionTier.FREE,
    price: { monthly: 0, yearly: 0 },
    maxUsers: 3,
    features: {
      aiFeatures: false,
      projectTemplates: false,
      prioritySupport: false,
      customBranding: false,
      ssoScim: false,
      auditLogs: false,
      fileStorage: '100MB',
    },
  },
  [SubscriptionTier.ESSENTIALS]: {
    name: 'Essentials',
    tier: SubscriptionTier.ESSENTIALS,
    price: { monthly: 10, yearly: 100 },
    maxUsers: 10,
    features: {
      aiFeatures: false,
      projectTemplates: true,
      prioritySupport: false,
      customBranding: false,
      ssoScim: false,
      auditLogs: false,
      fileStorage: '1GB',
    },
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    tier: SubscriptionTier.PRO,
    price: { monthly: 20, yearly: 200 },
    maxUsers: 10,
    features: {
      aiFeatures: true,
      projectTemplates: true,
      prioritySupport: false,
      customBranding: false,
      ssoScim: false,
      auditLogs: false,
      fileStorage: '2GB',
    },
  },
  [SubscriptionTier.BUSINESS]: {
    name: 'Business',
    tier: SubscriptionTier.BUSINESS,
    price: { monthly: 50, yearly: 500 },
    maxUsers: 50,
    features: {
      aiFeatures: true,
      projectTemplates: true,
      prioritySupport: true,
      customBranding: true,
      ssoScim: true,
      auditLogs: true,
      fileStorage: '10GB',
    },
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    tier: SubscriptionTier.ENTERPRISE,
    price: { monthly: 149, yearly: 1499 },
    maxUsers: 100,
    features: {
      aiFeatures: true,
      projectTemplates: true,
      prioritySupport: true,
      customBranding: true,
      ssoScim: true,
      auditLogs: true,
      fileStorage: '20GB',
    },
  },
};

/** Tiers that include AI features */
export const AI_ENABLED_TIERS: SubscriptionTier[] = [
  SubscriptionTier.PRO,
  SubscriptionTier.BUSINESS,
  SubscriptionTier.ENTERPRISE,
];

/** Tiers that include audit logs */
export const AUDIT_ENABLED_TIERS: SubscriptionTier[] = [
  SubscriptionTier.BUSINESS,
  SubscriptionTier.ENTERPRISE,
];
