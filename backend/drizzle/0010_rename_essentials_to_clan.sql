-- Rename the 'essentials' tier to 'clan' across all tier-bearing rows.
-- Subscriptions table is the live billing tier; integration_providers stores
-- the gate per provider. Idempotent: safe to re-run.
UPDATE subscriptions SET subscription_tier = 'clan' WHERE subscription_tier = 'essentials';
UPDATE integration_providers SET required_tier = 'clan' WHERE required_tier = 'essentials';
