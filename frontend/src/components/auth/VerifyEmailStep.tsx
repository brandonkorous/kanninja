'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { Field, Input } from '@/components/ui';

// Second step of sign-up: enter the 6-digit verification code emailed to the
// user. Sign-up already created the session, so this confirms the address and
// moves on. "Start over" returns to the email/password step.

export function VerifyEmailStep({
    email,
    onStartOver,
}: {
    email: string;
    onStartOver: () => void;
}) {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resent, setResent] = useState(false);

    async function handleVerify(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const { error: verifyError } = await authClient.emailOtp.verifyEmail({
                email,
                otp: code,
            });
            if (verifyError) {
                setError(getAuthErrorMessage(verifyError));
                return;
            }
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResend() {
        setError(null);
        setResent(false);
        try {
            const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
                email,
                type: 'email-verification',
            });
            if (resendError) {
                setError(getAuthErrorMessage(resendError));
                return;
            }
            setResent(true);
        } catch (err) {
            setError(getAuthErrorMessage(err));
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

            {resent && (
                <p role="status" className="mt-8 text-sm text-base-content/70">
                    Sent another code.
                </p>
            )}

            <div className="mt-8 flex flex-col items-start gap-4">
                <button
                    type="button"
                    onClick={handleResend}
                    className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 hover:text-primary transition-colors"
                >
                    Didn&rsquo;t arrive? Send another
                </button>
                <button
                    type="button"
                    onClick={onStartOver}
                    className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 hover:text-primary transition-colors"
                >
                    Wrong address? Start over
                </button>
            </div>
        </div>
    );
}
