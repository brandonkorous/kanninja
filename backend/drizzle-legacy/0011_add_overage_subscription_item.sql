-- Track the Stripe subscription_item id for the seat-overage line, when one
-- exists. Nullable: subscriptions only get an overage item once their unique
-- seat count exceeds the tier's included quota. Idempotent.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_overage_subscription_item_id TEXT;
