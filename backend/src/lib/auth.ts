import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { hashPassword } from 'better-auth/crypto';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { authUsers, authSessions, authAccounts, authVerifications } from '../db/schema/auth.js';
import { provisionProfile } from '../services/profile-provisioning.service.js';
import {
  sendVerificationCodeEmail,
  sendPasswordResetCodeEmail,
  sendPasswordResetEmail,
  assertEmailConfigured,
} from '../services/email.service.js';

/**
 * Better Auth is the authentication server; it owns the `auth_*` tables and
 * nothing else. The rest of the app keys on `profiles.id` and never sees an
 * `auth_users.id` — see `middleware/require-auth.ts` for the translation.
 */

if (env.NODE_ENV === 'production') {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error(
      'BETTER_AUTH_SECRET is required in production — without it session ' +
        'cookies are signed with an ephemeral key and every restart signs ' +
        'all users out.',
    );
  }
  assertEmailConfigured();
}

const BCRYPT_PREFIX = /^\$2[aby]?\$/;

/**
 * Passwords imported from Clerk are bcrypt; anything Better Auth writes is
 * scrypt. Verify against whichever the stored hash actually is, and quietly
 * upgrade bcrypt rows to scrypt as their owners sign in.
 *
 * Watch the migration finish with:
 *   SELECT count(*) FROM auth_accounts
 *    WHERE provider_id = 'credential' AND password LIKE '$2%';
 * When it plateaus, force-reset the stragglers and delete this function.
 */
async function verifyPasswordWithBcryptFallback({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (!BCRYPT_PREFIX.test(hash)) {
    // Not an imported hash — let Better Auth's own scrypt verifier handle it.
    // Returning false here would lock out every post-migration account, so we
    // must defer rather than guess.
    return verifyScrypt(hash, password);
  }

  const ok = await bcrypt.compare(password, hash);
  if (ok) void rehashToScrypt(hash, password);
  return ok;
}

/**
 * Better Auth's own password verifier, reached indirectly. `verifyPassword`
 * from `better-auth/crypto` takes the same ({hash, password}) shape; it is
 * kept in a named wrapper so the import site is obvious if the export moves.
 */
async function verifyScrypt(hash: string, password: string): Promise<boolean> {
  const { verifyPassword } = await import('better-auth/crypto');
  return verifyPassword({ hash, password });
}

async function rehashToScrypt(oldHash: string, plaintext: string): Promise<void> {
  try {
    const next = await hashPassword(plaintext);
    // Matching on the hash is safe: a bcrypt digest embeds a per-row random
    // salt, so it is effectively unique. (Verify with a GROUP BY after the
    // import — expect zero duplicates.)
    await db
      .update(authAccounts)
      .set({ password: next, updatedAt: new Date() })
      .where(and(eq(authAccounts.password, oldHash), eq(authAccounts.providerId, 'credential')));
  } catch (error) {
    // Never fail a sign-in because an opportunistic upgrade failed.
    // eslint-disable-next-line no-console
    console.error('[auth] password rehash failed', error);
  }
}

export const auth = betterAuth({
  appName: 'kanNINJA',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',

  database: drizzleAdapter(db, {
    provider: 'pg',
    // Keyed by Better Auth model name; the values are our renamed tables.
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),

  // kanninja.com (frontend) and api.kanninja.com (this server) are different
  // origins, so the session cookie has to be scoped to the parent domain and
  // every browser request needs credentials: 'include'. See plugins/cors.ts.
  trustedOrigins: [env.FRONTEND_URL],

  emailAndPassword: {
    enabled: true,
    // Verification is handled by the emailOTP plugin below (6-digit code),
    // matching the flow users already know from Clerk. Sign-in isn't blocked
    // on it, so an unverified user isn't stranded if email delivery hiccups.
    requireEmailVerification: false,
    minPasswordLength: 8,
    password: {
      verify: verifyPasswordWithBcryptFallback,
    },
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Google verifies email addresses, so a Google sign-in whose email
      // matches an existing account is the same person. This is also the
      // safety net for the Clerk import: if a migrated Google `sub` doesn't
      // match what our own OAuth client receives, the account links on first
      // sign-in instead of silently creating a duplicate user.
      trustedProviders: ['google'],
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes, matching the copy in email.service.ts
      sendVerificationOnSignUp: true,
      storeOTP: 'hashed',
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type === 'forget-password') {
          await sendPasswordResetCodeEmail(email, otp);
          return;
        }
        await sendVerificationCodeEmail(email, otp);
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        // Replaces Clerk's `user.created` webhook. Runs in-process on sign-up,
        // so there's no webhook delivery to miss and no lazy just-in-time sync
        // to fall back on.
        after: async (user) => {
          await provisionProfile({
            userId: user.id,
            email: user.email,
            displayName: user.name || null,
            avatarUrl: user.image ?? null,
          });
        },
      },
    },
  },

  advanced: {
    crossSubDomainCookies: {
      // Local dev is same-site on localhost, where a dot-domain cookie is
      // rejected outright — so this only switches on once a domain is set.
      enabled: Boolean(env.AUTH_COOKIE_DOMAIN),
      domain: env.AUTH_COOKIE_DOMAIN || undefined,
    },
    // Do NOT set database.generateId here. The Clerk import seeds
    // auth_users.id with Clerk's own `user_2…` ids so the profiles backfill is
    // a single UPDATE; forcing uuids would fight that.
  },
});

export type Auth = typeof auth;
