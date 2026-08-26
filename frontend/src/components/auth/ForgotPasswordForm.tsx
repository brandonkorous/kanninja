'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { ResetPasswordStep } from './ResetPasswordStep';
import { Field, Input } from '@/components/ui';

// Forgot-password entry: request a reset code by email. On success hands off
// to ResetPasswordStep which handles the code + new password submission.

export function ForgotPasswordForm() {
    const [resetting, setResetting] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleRequest(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const { error: requestError } = await authClient.emailOtp.requestPasswordReset({
                email,
            });
            // Advance even on error: this endpoint deliberately doesn't reveal
            // whether an account exists, so branching on the result here would
            // turn the screen into an enumeration oracle. A wrong email simply
            // never receives a code.
            if (requestError && requestError.status === 429) {
                setError(getAuthErrorMessage(requestError));
                return;
            }
            setResetting(true);
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    if (resetting) {
        return (
            <ResetPasswordStep email={email} onStartOver={() => setResetting(false)} />
        );
    }

    return (
        <div>
            <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                Locked out
            </p>
            <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                Reset your <span className="italic text-primary">password.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-base-content/70">
                Tell us the email on your account. We'll send a six-digit code.
            </p>

            {error && (
                <p
                    role="alert"
                    className="mt-8 text-sm text-error border-l-2 border-error pl-4"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleRequest} className="mt-10 space-y-6">
                <Field label="Email" htmlFor="email">
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Field>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                >
                    {submitting ? 'Sending…' : 'Send the code'}
                </button>
            </form>

            <p className="mt-12 text-sm text-base-content/60">
                Remembered it?{' '}
                <Link
                    href="/sign-in"
                    className="text-base-content hover:text-primary font-medium transition-colors"
                >
                    Sign in.
                </Link>
            </p>
        </div>
    );
}
