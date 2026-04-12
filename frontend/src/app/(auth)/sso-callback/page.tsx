'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

// OAuth redirect target. Clerk finishes the handshake here and forwards
// to /dashboard. Nothing to render beyond the brief moment before the
// redirect fires — a tiny voice-aligned placeholder for the edge case
// where the redirect is slow.

export default function SSOCallbackPage() {
    return (
        <div>
            <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                Almost there
            </p>
            <h1 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                Finishing <span className="italic text-primary">the handshake.</span>
            </h1>
            <p className="mt-8 text-base leading-relaxed text-base-content/70">
                One moment. Redirecting you to the dojo.
            </p>
            <AuthenticateWithRedirectCallback
                signInFallbackRedirectUrl="/dashboard"
                signUpFallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
