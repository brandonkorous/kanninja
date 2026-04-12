'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { getClerkErrorMessage } from './clerk-errors';
import { ResetPasswordStep } from './ResetPasswordStep';
import { Field, Input } from '@/components/ui';

// Forgot-password entry: request a reset code by email. On success hands off
// to ResetPasswordStep which handles the code + new password submission.

export function ForgotPasswordForm() {
    const { signIn, isLoaded } = useSignIn();
    const [resetting, setResetting] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleRequest(e: React.FormEvent) {
        e.preventDefault();
        if (!isLoaded || !signIn) return;
        setError(null);
        setSubmitting(true);
        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            setResetting(true);
        } catch (err) {
            setError(getClerkErrorMessage(err));
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
                    disabled={submitting || !isLoaded}
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
