/**
 * Re-sync every active paid subscription's seat-overage line to Stripe.
 *
 * Belt-and-braces for the rare case where the request-time sync hook in
 * clan-member add/remove silently failed (Stripe transient error, network).
 * Each subscription is processed independently — a single failure doesn't
 * abort the run.
 *
 * Run manually:
 *   pnpm --filter @kanninja/backend run reconcile-seats
 *
 * Or schedule on AKS as a Kubernetes CronJob pointing at:
 *   node dist/scripts/reconcile-seats.js
 *
 * Exits non-zero if any subscription failed, so the cron monitor can alert.
 */
import 'dotenv/config';
import { reconcileAllSubscriptions } from '../services/seat-billing.service.js';

async function main() {
  const startedAt = Date.now();
  console.log('[reconcile-seats] starting');

  const result = await reconcileAllSubscriptions();
  const ms = Date.now() - startedAt;

  console.log(
    `[reconcile-seats] done in ${ms}ms — processed=${result.processed} failed=${result.failed}`,
  );
  for (const f of result.failures) {
    console.error(`[reconcile-seats] FAIL userId=${f.userId} error=${f.error}`);
  }

  process.exit(result.failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('[reconcile-seats] fatal', err);
  process.exit(1);
});
