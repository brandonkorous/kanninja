'use client';

import { useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useClan } from '@/hooks/use-clans';
import { useClanView, type ClanView } from '@/hooks/use-view-preference';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';

/**
 * Shared layout for the clan's three aggregated views (calendar,
 * timeline, list). Mirrors the dojo views layout but tabs back to
 * the clan settings/members page (`/clans/[clanId]`) instead of
 * including a Members tab — the members surface is rich enough to
 * stand on its own.
 *
 * Lives inside a `(views)` route group so the existing members page
 * keeps its own header / chrome and isn't double-wrapped.
 */
export default function ClanViewsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const clanId = params.clanId as string;
  const pathname = usePathname();
  const { data: clan, isLoading, error } = useClan(clanId);
  const { setView } = useClanView(clanId);

  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (['calendar', 'timeline', 'list'].includes(last)) {
      setView(last as ClanView);
    }
  }, [pathname, setView]);

  if (isLoading) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
      >
        Looking up the clan…
      </p>
    );
  }

  if (error || !clan) {
    return (
      <div role="alert" className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
        <p className="text-eyebrow font-mono uppercase tracking-widest text-error">Sealed</p>
        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
          We couldn&rsquo;t find this <span className="italic text-primary">clan.</span>
        </h2>
        <Link href="/clans" className="btn btn-secondary mt-6">
          Back to clans
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <Link
            href={`/clans/${clanId}`}
            aria-label="Back to clan members"
            className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:text-base-content shrink-0"
          >
            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          </Link>
          <h1 className="font-display text-2xl font-medium tracking-tight min-w-0 truncate">
            {clan.name}
          </h1>
        </div>
        <span className="hidden sm:inline text-eyebrow font-mono uppercase tracking-widest text-base-content/40 shrink-0">
          {clan.currentUserRole}
        </span>
      </header>

      <ViewSwitcher basePath={`/clans/${clanId}`} scope="clan" />

      <div className="flex-1 overflow-hidden mt-6">{children}</div>
    </div>
  );
}
