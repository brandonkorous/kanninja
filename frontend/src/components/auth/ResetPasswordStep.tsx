'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { Field, Input } from '@/components/ui';

// Second step of the forgot-password flow: enter the 6-digit reset code and
// pick a new password. Resetting does not create a session, so we hand the
// user to sign-in with the credentials they just set.

export function ResetPasswordStep({
    email,
    onStartOver,
}: {
    email: string;
    onStartOver: () => void;
}) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const { error: resetError } = await authClient.emailOtp.resetPassword({
                email,
                otp: code,
                password,
            });
            if (resetError) {
                setError(getAuthErrorMessage(resetError));
                return;
            }

            // Sign straight in so the flow still ends on the dashboard, as it
            // did under Clerk. If that fails for any reason the password change
            // still succeeded, so fall back to the sign-in screen rather than
            // showing an error that implies otherwise.
            const { error: signInError } = await authClient.signIn.email({ email, password });
            router.push(signInError ? '/sign-in' : '/dashboard');
            router.refresh();
        } catch (err) {
            setError(getAuthErrorMessage(err));
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
