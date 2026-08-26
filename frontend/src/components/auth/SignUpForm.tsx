'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { VerifyEmailStep } from './VerifyEmailStep';
import { Field, Input } from '@/components/ui';

export function SignUpForm() {
    const [verifying, setVerifying] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            // `name` is required by Better Auth's user model; the email
            // local-part is the same default the Clerk import uses, and the
            // user renames it in settings.
            const { error: signUpError } = await authClient.signUp.email({
                email,
                password,
                name: email.split('@')[0],
            });
            if (signUpError) {
                setError(getAuthErrorMessage(signUpError));
                return;
            }
            // The server sends the code on sign-up (sendVerificationOnSignUp),
            // so go straight to the code step.
            setVerifying(true);
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleGoogle() {
        setError(null);
        try {
            await authClient.signIn.social({
                provider: 'google',
                callbackURL: `${window.location.origin}/dashboard`,
                errorCallbackURL: `${window.location.origin}/sign-up`,
            });
        } catch (err) {
            setError(getAuthErrorMessage(err));
        }
    }

    if (verifying) {
        return <VerifyEmailStep email={email} onStartOver={() => setVerifying(false)} />;
    }

    return (
        <div>
            <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                Welcome
            </p>
            <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                Start your <span className="italic text-primary">first kata.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-base-content/70">
                Takes two minutes. Free forever.
            </p>

            {error && (
                <p
                    role="alert"
                    className="mt-8 text-sm text-error border-l-2 border-error pl-4"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleCreate} className="mt-10 space-y-6">
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
                <Field
                    label="Password"
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
                    disabled={submitting}
                    className="btn btn-primary w-full"
                >
                    {submitting ? 'Creating…' : 'Create account'}
                </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-base-300" />
                <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                    or
                </span>
                <div className="flex-1 h-px bg-base-300" />
            </div>

            <button
                type="button"
                onClick={handleGoogle}
                className="btn btn-outline btn-secondary w-full mt-8 gap-3"
            >
                <FontAwesomeIcon icon={faGoogle} />
                Continue with Google
            </button>

            <p className="mt-12 text-sm text-base-content/60">
                Already practicing?{' '}
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
