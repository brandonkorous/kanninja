'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Sidebar } from '@/components/layout/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Workspace tool routes (currently the dojo board) should fill the
  // viewport. The default generous main padding (lg:py-16 lg:px-12) is
  // right for marketing-style detail pages — dashboard, clans, settings —
  // where breathing room is the point. For the kanban canvas, every pixel
  // of vertical space matters, so we tighten down to lg:py-6 / lg:px-8 and
  // shrink the mobile top inset to just-enough to clear the floating
  // hamburger button (top-4 + 48px = 64px → pt-16).
  const isToolRoute = pathname.startsWith('/dojo/');
  const mainPadding = isToolRoute
    ? 'px-6 py-16 lg:px-8 lg:py-6'
    : 'px-6 py-20 lg:px-12 lg:py-16';

  // Close drawer on route change (mobile).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh flex bg-base-200">
      {/* Skip link — first in tab order, revealed on focus. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-base-100 focus:text-base-content focus:px-4 focus:py-2 focus:rounded-md focus:border focus:border-base-300"
      >
        Skip to content
      </a>

      <Sidebar
        drawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer backdrop. */}
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-base-content/30 backdrop-blur-[1px]"
        />
      )}

      {/* Main content column. */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only hamburger — floats in the top-left below lg. */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-label="Open navigation"
          className="lg:hidden fixed top-4 left-4 z-20 btn btn-square bg-base-100 border border-base-300 shadow-e1"
        >
          <FontAwesomeIcon icon={faBars} aria-hidden="true" />
        </button>

        <main
          id="main-content"
          className={`flex-1 overflow-auto ${mainPadding}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
