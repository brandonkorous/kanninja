'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { getClerkErrorMessage } from './clerk-errors';
import { Field, Input } from '@/components/ui';

// Second step of sign-up: enter the 6-digit verification code Clerk emailed
// to the user. On success, sets the active session and redirects to the
// dashboard. "Start over" returns to the email/password step.

export function VerifyEmailStep({
    email,
    onStartOver,
}: {
    email: string;
    onStartOver: () => void;
}) {
    const { signUp, setActive, isLoaded } = useSignUp();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        if (!isLoaded || !signUp) return;
        setError(null);
        setSubmitting(true);
        try {
            const result = await signUp.attemptEmailAddressVerification({ code });
            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId });
                router.push('/dashboard');
                return;
            }
            setError('Verification did not complete. Try again.');
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
                Check your <span className="italic text-primary">email.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-base-content/70">
                We sent a six-digit code to <strong>{email}</strong>.
            </p>

            {error && (
                <p
                    role="alert"
                    className="mt-8 text-sm text-error border-l-2 border-error pl-4"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleVerify} className="mt-10 space-y-6">
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
                <button
                    type="submit"
                    disabled={submitting || code.length < 6}
                    className="btn btn-primary w-full"
                >
                    {submitting ? 'Verifying…' : 'Verify'}
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
