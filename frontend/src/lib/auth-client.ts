'use client';

import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

/**
 * Better Auth browser client.
 *
 * Auth lives on the API origin (api.kanninja.com), not on the Next.js origin,
 * so `baseURL` points at the backend and the session cookie is scoped to the
 * shared parent domain (`.kanninja.com`) by the server's
 * `advanced.crossSubDomainCookies` setting. Every call is cross-origin with
 * credentials, which is why `@fastify/cors` runs with `credentials: true` and
 * a single exact origin.
 */
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    basePath: '/api/auth',
    fetchOptions: {
        credentials: 'include',
    },
    plugins: [emailOTPClient()],
});

export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword } = authClient;
