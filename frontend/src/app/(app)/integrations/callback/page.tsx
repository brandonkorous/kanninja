'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function IntegrationCallbackPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    // Notify the parent window that opened this popup
    if (window.opener) {
      window.opener.postMessage(
        { type: 'integration-callback', success: !!success, error },
        window.location.origin,
      );
      window.close();
    }
  }, [success, error]);

  // Fallback UI if popup doesn't auto-close
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {success ? (
          <>
            <h2 className="font-display text-2xl font-medium mb-2">Connected!</h2>
            <p className="text-base-content/60">
              You can close this window. Your integration is ready.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-medium mb-2">
              Connection failed
            </h2>
            <p className="text-base-content/60">
              {error || 'Something went wrong. Please try again.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
