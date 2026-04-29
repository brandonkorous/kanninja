import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id).unique(),
  email: text('email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  /** Stripe subscription_item id for the seat-overage line, when one exists.
   *  NULL means the subscription has no overage item yet (either tier doesn't
   *  support overage, or seat count is at/under the included quota). */
  stripeOverageSubscriptionItemId: text('stripe_overage_subscription_item_id'),
  subscribed: boolean('subscribed').default(false).notNull(),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  subscriptionEnd: timestamp('subscription_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
