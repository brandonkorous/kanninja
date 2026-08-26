'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { authClient } from '@/lib/auth-client';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { Field, Input } from '@/components/ui';

export function SignInForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            // Better Auth resolves rather than throws — the failure is in `error`.
            const { error: signInError } = await authClient.signIn.email({ email, password });
            if (signInError) {
                setError(getAuthErrorMessage(signInError));
                return;
            }
            // The session cookie is set by the response; refresh so the server
            // components behind /dashboard see it.
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(getAuthErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    }

    async function handleGoogle() {
        setError(null);
        try {
            // Full-page redirect to Google and back to the API's callback,
            // which then bounces to callbackURL. No /sso-callback page needed.
            await authClient.signIn.social({
                provider: 'google',
                callbackURL: `${window.location.origin}/dashboard`,
                errorCallbackURL: `${window.location.origin}/sign-in`,
            });
        } catch (err) {
            setError(getAuthErrorMessage(err));
        }
    }

    return (
        <div>
            <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                Welcome back
            </p>
            <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                Sign in to <span className="italic text-primary">begin.</span>
            </h1>

            {error && (
                <p
                    role="alert"
                    className="mt-8 text-sm text-error border-l-2 border-error pl-4"
                >
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
                    labelRight={
                        <Link
                            href="/forgot-password"
                            className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 hover:text-primary transition-colors"
                        >
                            Forgot?
                        </Link>
                    }
                >
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Field>
                <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                >
                    {submitting ? 'Signing in…' : 'Sign in'}
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
                New here?{' '}
                <Link
                    href="/sign-up"
                    className="text-base-content hover:text-primary font-medium transition-colors"
                >
                    Start a kata.
                </Link>
            </p>
        </div>
    );
}
