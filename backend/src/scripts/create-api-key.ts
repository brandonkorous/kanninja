/**
 * CLI script to generate an API key for local development.
 *
 * Usage (from v2/):
 *   pnpm --filter @kanninja/backend run create-api-key <email> [display-name]
 *
 * Example:
 *   pnpm --filter @kanninja/backend run create-api-key brandon@wizeworks.com "Claude Code"
 */
import 'dotenv/config';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { eq } from 'drizzle-orm';
import { apiKeyService } from '../services/api-key.service.js';

const email = process.argv[2];
const displayName = process.argv[3] ?? 'Dev Key';

if (!email) {
  console.error('Usage: create-api-key <email> [display-name]');
  console.error('  email: the email of the user to create the key for');
  console.error('  display-name: optional label (default: "Dev Key")');
  process.exit(1);
}

async function main() {
  const [profile] = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (!profile) {
    console.error(`No profile found for email: ${email}`);
    console.error('Make sure the user has signed in at least once.');
    process.exit(1);
  }

  const result = await apiKeyService.createKey(profile.id, displayName);

  console.log('\n  API key created successfully!\n');
  console.log(`  User:    ${profile.email}`);
  console.log(`  Label:   ${result.displayName}`);
  console.log(`  Prefix:  ${result.prefix}`);
  console.log(`  Key:     ${result.fullKey}`);
  console.log('\n  Save this key now — it cannot be retrieved again.\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create API key:', err.message);
  process.exit(1);
});
