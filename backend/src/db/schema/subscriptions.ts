import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id).unique(),
  email: text('email').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  subscribed: boolean('subscribed').default(false).notNull(),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  subscriptionEnd: timestamp('subscription_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
