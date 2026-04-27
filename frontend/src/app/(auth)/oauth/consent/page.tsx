import { Suspense } from 'react';
import { OAuthConsent } from './OAuthConsent';

export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <p
          role="status"
          aria-live="polite"
          className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
        >
          Looking up the request…
        </p>
      }
    >
      <OAuthConsent />
    </Suspense>
  );
}
