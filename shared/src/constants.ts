import { SubscriptionTier } from './enums.js';

/**
 * How a tier charges.
 *
 * Two shapes for two tiers. The union survives the collapse from five tiers
 * because it is what makes "Free is not just a cheap Pro" explicit — and if a
 * flat or custom shape is ever wanted again, it belongs here rather than in a
 * new set of nullable columns.
 */
export type TierPricing =
  | { model: 'free' }
  /** `monthly` / `yearly` are PER SEAT, not per account. */
  | { model: 'per_seat'; monthly: number; yearly: number; minSeats: number };

export interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  pricing: TierPricing;
  /** Included storage in MB, pooled across the account. */
  storageIncludedMb: number;
  features: {
    /** MCP tool calls per minute — the one capability axis that is actually
     *  enforced (mcp-remote/src/index.ts) and the one that scales with what an
     *  agent-driven workload costs us. */
    mcpRequestsPerMinute: number;
  };
}

/** Yearly is ten months of the monthly rate — two months free. */
export const YEARLY_MONTHS_CHARGED = 10;

/**
 * TWO TIERS. Nothing is held back for a tier above.
 *
 * The old grid sold five tiers on eight differentiators, six of which were
 * never enforced anywhere in the codebase — templates, storage, audit logs and
 * priority support were ungated, and SSO/SCIM was a boolean with no
 * implementation behind it. Collapsing removed the pretence, not the product.
 *
 * Free is sized for the audience that will never pay and should not be asked
 * to: a wedding party, a soccer team, a household. Ten seats covers almost all
 * of them, which is the point — they are word of mouth, not a $10 line item.
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    tier: SubscriptionTier.FREE,
    pricing: { model: 'free' },
    storageIncludedMb: 2_000,
    features: {
      mcpRequestsPerMinute: 20,
    },
  },
  [SubscriptionTier.CLAN]: {
    name: 'Clan',
    tier: SubscriptionTier.CLAN,
    // $12 sits at Monday Standard, above ClickUp ($7), under Asana ($13.49) —
    // and unlike any of them there is no tier above holding anything back.
    pricing: { model: 'per_seat', monthly: 12, yearly: 120, minSeats: 1 },
    storageIncludedMb: 1_000_000,
    features: {
      mcpRequestsPerMinute: 600,
    },
  },
};

/** Seat ceiling on Free. Per-seat tiers have none — see getSeatCap(). */
export const FREE_SEAT_CAP = 10;

/**
 * Extra storage, sold in blocks on the Clan plan.
 *
 * Priced near cost deliberately — Azure Blob is ~$0.02/GB/month, so the $5/GB
 * some tools charge invites the obvious question. This exists because someone
 * will occasionally need it, not as a growth lever; the upgrade we sell is
 * seats.
 *
 * NOT YET ENFORCEABLE. Nothing meters attachment bytes today, so a block sold
 * now would charge for a limit that does not exist. Metering ships first.
 */
export const STORAGE_ADD_ON = {
  blockGb: 100,
  monthlyPerBlock: 4,
};

/**
 * Per-file upload ceiling, both tiers. Independent of the pooled allowance:
 * it stops kanNINJA being used as a CDN, which is the failure a generous total
 * actually invites. Trello's equivalent is 10MB on free.
 */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
