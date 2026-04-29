import { SubscriptionTier } from './enums.js';

export interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  price: { monthly: number; yearly: number };
  /** Seats included in the flat price. Overage applies above this on tiers
   *  where seatOveragePrice is non-null. Enterprise is custom (Infinity). */
  maxUsers: number;
  /** Per-seat monthly price for seats over maxUsers. null = hard cap. */
  seatOveragePrice: number | null;
  features: {
    /** In-app AI features (kanNINJA pays LLM tokens — metered for margin). */
    aiFeatures: boolean;
    /** AI runs allowed per month. Free uses lifetime quota — see aiRunsLifetime. */
    aiRunsPerMonth: number | null;
    /** Free-tier taste quota; non-null only on Free. */
    aiRunsLifetime: number | null;
    /** MCP tool calls per minute (rate limit only — no monthly cap, since MCP
     *  uses the user's own LLM, not ours). */
    mcpRequestsPerMinute: number;
    projectTemplates: boolean;
    prioritySupport: boolean;
    ssoScim: boolean;
    auditLogs: boolean;
    dedicatedCsm: boolean;
    fileStorage: string;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    tier: SubscriptionTier.FREE,
    price: { monthly: 0, yearly: 0 },
    maxUsers: 3,
    seatOveragePrice: null,
    features: {
      aiFeatures: true,
      aiRunsPerMonth: null,
      aiRunsLifetime: 50,
      mcpRequestsPerMinute: 10,
      projectTemplates: false,
      prioritySupport: false,
      ssoScim: false,
      auditLogs: false,
      dedicatedCsm: false,
      fileStorage: '100MB',
    },
  },
  [SubscriptionTier.CLAN]: {
    name: 'Clan',
    tier: SubscriptionTier.CLAN,
    price: { monthly: 10, yearly: 100 },
    maxUsers: 15,
    seatOveragePrice: null,
    features: {
      aiFeatures: true,
      aiRunsPerMonth: 200,
      aiRunsLifetime: null,
      mcpRequestsPerMinute: 30,
      projectTemplates: true,
      prioritySupport: false,
      ssoScim: false,
      auditLogs: false,
      dedicatedCsm: false,
      fileStorage: '5GB',
    },
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    tier: SubscriptionTier.PRO,
    price: { monthly: 25, yearly: 250 },
    maxUsers: 15,
    seatOveragePrice: 4,
    features: {
      aiFeatures: true,
      aiRunsPerMonth: 2000,
      aiRunsLifetime: null,
      mcpRequestsPerMinute: 120,
      projectTemplates: true,
      prioritySupport: false,
      ssoScim: false,
      auditLogs: false,
      dedicatedCsm: false,
      fileStorage: '10GB',
    },
  },
  [SubscriptionTier.BUSINESS]: {
    name: 'Business',
    tier: SubscriptionTier.BUSINESS,
    price: { monthly: 99, yearly: 990 },
    maxUsers: 50,
    seatOveragePrice: 6,
    features: {
      aiFeatures: true,
      aiRunsPerMonth: 20000,
      aiRunsLifetime: null,
      mcpRequestsPerMinute: 600,
      projectTemplates: true,
      prioritySupport: true,
      ssoScim: true,
      auditLogs: true,
      dedicatedCsm: false,
      fileStorage: '50GB',
    },
  },
  [SubscriptionTier.ENTERPRISE]: {
    name: 'Enterprise',
    tier: SubscriptionTier.ENTERPRISE,
    price: { monthly: 0, yearly: 0 },
    maxUsers: Number.POSITIVE_INFINITY,
    seatOveragePrice: null,
    features: {
      aiFeatures: true,
      aiRunsPerMonth: null,
      aiRunsLifetime: null,
      mcpRequestsPerMinute: 6000,
      projectTemplates: true,
      prioritySupport: true,
      ssoScim: true,
      auditLogs: true,
      dedicatedCsm: true,
      fileStorage: 'Custom',
    },
  },
};

/** Tiers where in-app AI features are accessible (gated by quota above Free). */
export const AI_ENABLED_TIERS: SubscriptionTier[] = [
  SubscriptionTier.FREE,
  SubscriptionTier.CLAN,
  SubscriptionTier.PRO,
  SubscriptionTier.BUSINESS,
  SubscriptionTier.ENTERPRISE,
];

/** Tiers that include audit logs */
export const AUDIT_ENABLED_TIERS: SubscriptionTier[] = [
  SubscriptionTier.BUSINESS,
  SubscriptionTier.ENTERPRISE,
];
