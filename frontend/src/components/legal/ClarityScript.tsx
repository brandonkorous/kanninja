'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { useConsent } from '@/providers/ConsentProvider';

// Microsoft Clarity (session replay + heatmaps), gated on session-replay
// consent. Behavior contract:
//
//   1. Script is NEVER loaded unless the visitor has explicitly granted
//      session-replay consent via the banner, dialog, or privacy-choices
//      page. GPC-defaulted visitors arrive with `rejected` and stay opted
//      out by default.
//
//   2. When consent is later revoked, we ask Clarity to stop recording
//      via `clarity('consent', false)` + `clarity('stop')`, and clear the
//      cookies it sets. The <script> tag stays in the DOM (re-mounting it
//      would re-inject the CDN tag and double-track) — only its behavior
//      is shut off.
//
//   3. If consent is revoked then re-granted, we call `clarity('consent')`
//      again instead of re-loading the SDK.
//
// The Clarity Project ID comes from NEXT_PUBLIC_CLARITY_PROJECT_ID; if it
// is missing or blank (CI / local-without-keys), we never render anything.

declare global {
    interface Window {
        clarity?: (...args: unknown[]) => void;
    }
}

// Project IDs from clarity.microsoft.com are short alphanumeric strings.
// Sanitize defensively so an attacker-controlled env value can't escape
// the inline <script>. (Realistically the env is operator-controlled, but
// this is cheap.)
function sanitizeProjectId(raw: string | undefined): string | null {
    if (!raw) return null;
    const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '');
    return cleaned.length > 0 ? cleaned : null;
}

// Cookies Clarity is known to set. Clearing on revocation matches the
// spirit of the user's opt-out — the SDK call alone leaves them in place.
const CLARITY_COOKIES = ['_clck', '_clsk', 'CLID', 'ANONCHK', 'MR', 'MUID', 'SM'];

function clearClarityCookies() {
    if (typeof document === 'undefined') return;
    const host = window.location.hostname;
    const domains = [host, `.${host}`];
    for (const name of CLARITY_COOKIES) {
        // Plain (no domain) — handles localhost.
        document.cookie = `${name}=; Max-Age=0; path=/`;
        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
        }
    }
}

const PROJECT_ID = sanitizeProjectId(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID);

export function ClarityScript() {
    const { consent, hydrated } = useConsent();
    const allow = consent.sessionReplay === 'accepted';

    // Once the script has been mounted, we keep it mounted so revocation
    // can be handled via the SDK rather than DOM removal.
    const [scriptMounted, setScriptMounted] = useState(false);
    const previousAllowRef = useRef<boolean | null>(null);

    useEffect(() => {
        if (!hydrated || !PROJECT_ID) return;

        const previous = previousAllowRef.current;

        if (allow && !scriptMounted) {
            // First-ever grant — render the <Script>; the IIFE inside
            // injects the CDN tag and starts recording.
            setScriptMounted(true);
        } else if (previous === true && !allow) {
            // Revocation — stop recording and wipe Clarity cookies.
            try {
                window.clarity?.('consent', false);
                window.clarity?.('stop');
            } catch {
                // SDK not loaded or threw — nothing to do.
            }
            clearClarityCookies();
        } else if (previous === false && allow && scriptMounted) {
            // Re-grant after a previous revocation — re-enable via SDK.
            try {
                window.clarity?.('consent');
            } catch {
                // SDK not loaded — should not happen if scriptMounted.
            }
        }

        previousAllowRef.current = allow;
    }, [allow, hydrated, scriptMounted]);

    if (!PROJECT_ID || !scriptMounted) return null;

    // Inline init copied from clarity.microsoft.com → Setup. The
    // `clarity('consent')` call after the IIFE is harmless when the project
    // is not in consent-required mode and is required when it is.
    return (
        <Script id="clarity-init" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${PROJECT_ID}");
window.clarity('consent');`}
        </Script>
    );
}
