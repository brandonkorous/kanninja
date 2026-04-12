'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { getClerkErrorMessage } from './clerk-errors';
import { Field, Input } from '@/components/ui';

// Second step of the forgot-password flow: enter the 6-digit reset code and
// pick a new password. On success, Clerk sets the active session and we
// redirect to the dashboard (the user is effectively signed in).

export function ResetPasswordStep({
    email,
    onStartOver,
}: {
    email: string;
    onStartOver: () => void;
}) {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        if (!isLoaded || !signIn) return;
        setError(null);
        setSubmitting(true);
        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                router.push('/dashboard');
                return;
            }
            setError('Reset did not complete. Try again.');
        } catch (err) {
            setError(getClerkErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                Almost there
            </p>
            <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                A fresh <span className="italic text-primary">password.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-base-content/70">
                We sent a six-digit code to <strong>{email}</strong>. Enter it and
                pick a new password.
            </p>

            {error && (
                <p
                    role="alert"
                    className="mt-8 text-sm text-error border-l-2 border-error pl-4"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleReset} className="mt-10 space-y-6">
                <Field label="Code" htmlFor="code">
                    <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center font-mono text-2xl tracking-[0.5em]"
                    />
                </Field>
                <Field
                    label="New password"
                    htmlFor="password"
                    hint="Eight characters or more."
                >
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Field>
                <button
                    type="submit"
                    disabled={submitting || code.length < 6 || password.length < 8}
                    className="btn btn-primary w-full"
                >
                    {submitting ? 'Resetting…' : 'Reset and sign in'}
                </button>
            </form>

            <button
                type="button"
                onClick={onStartOver}
                className="mt-8 text-eyebrow font-mono uppercase tracking-widest text-base-content/50 hover:text-primary transition-colors"
            >
                Wrong address? Start over
            </button>
        </div>
    );
}
