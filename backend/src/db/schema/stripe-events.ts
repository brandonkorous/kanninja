import { pgTable, text, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull().default('received'), // received | processed | failed
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
