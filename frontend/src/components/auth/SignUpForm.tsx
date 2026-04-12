'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { getClerkErrorMessage } from './clerk-errors';
import { VerifyEmailStep } from './VerifyEmailStep';
import { Field, Input } from '@/components/ui';

export function SignUpForm() {
    const { signUp, isLoaded } = useSignUp();
    const [verifying, setVerifying] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!isLoaded || !signUp) return;
        setError(null);
        setSubmitting(true);
        try {
            await signUp.create({ emailAddress: email, password });
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setVerifying(true);
        } catch (err) {
            setError(getClerkErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleGoogle() {
        if (!isLoaded || !signUp) return;
        setError(null);
        try {
            await signUp.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl: '/sso-callback',
                redirectUrlComplete: '/dashboard',
            });
        } catch (err) {
            setError(getClerkErrorMessage(err));
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
                {/* CAPTCHA target — Clerk renders the bot check here if enabled */}
                <div id="clerk-captcha" />
                <button
                    type="submit"
                    disabled={submitting || !isLoaded}
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
                disabled={!isLoaded}
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
