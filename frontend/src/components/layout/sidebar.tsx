'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { UserDropdown } from '@/components/layout/user-dropdown';
import { ThemeSwitcher } from '@/components/layout/theme-switcher';
import { Wordmark } from '@/components/layout/wordmark';
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed';
import { NAV_GROUPS } from '@/components/layout/nav-config';

// IMPORTANT: `collapsed` is a desktop-only mode (lg+). Below lg the sidebar
// is the off-canvas drawer and must always render at full width regardless
// of the persisted preference. Every collapse-driven style is gated with a
// `lg:` prefix so mobile drawer rendering is unaffected.

type SidebarProps = { drawerOpen: boolean; onDrawerClose: () => void };

export function Sidebar({ drawerOpen, onDrawerClose }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle, mounted } = useSidebarCollapsed();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Width transition is suppressed until mount so the initial snap to the
  // persisted collapsed value doesn't animate on first paint.
  const asideClasses = [
    'fixed inset-y-0 left-0 z-40 w-72 bg-base-100 border-r border-base-300 flex flex-col',
    // lg:relative (not lg:static) so the floating collapse handle below can
    // anchor absolutely to the sidebar's right edge on desktop. relative
    // doesn't take the aside out of the parent flex flow.
    'transform transition-transform duration-300 ease-out lg:translate-x-0 lg:relative lg:transform-none',
    mounted
      ? 'lg:transition-[width] lg:duration-200 lg:ease-out motion-reduce:lg:transition-none'
      : '',
    // lg:w-20 (80px): icon center ≈ 39, aside center = 40 → reads centered.
    collapsed ? 'lg:w-20' : 'lg:w-72',
    drawerOpen ? 'translate-x-0' : '-translate-x-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside aria-label="Primary" className={asideClasses}>
      {/* Floating collapse handle — straddles the sidebar's right edge on
          desktop (half on / half off via -right-4 for the 32px button).
          Hidden on mobile; the drawer has its own close button. Icon is a
          panel-fold glyph: rounded canvas + filled left rail + directional
          chevron — the literal "sidebar" icon, reads at a glance. */}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="hidden lg:flex absolute top-20 -right-4 z-50 h-8 w-8 items-center justify-center rounded-full bg-base-100 border border-base-300 text-base-content/60 hover:text-primary hover:border-primary/40 hover:bg-primary/10 shadow-e1 hover:shadow-e2 transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d={collapsed ? 'm14 9 3 3-3 3' : 'm16 15-3-3 3-3'} />
        </svg>
      </button>

      {/* Header — NO-SHIFT collapse. Both Links use `inline-flex items-center
          flex-shrink-0`: (a) height = content (36px) in both states instead
          of the wordmark Link being 42px from Inter line-box wonk, (b) stamp
          img isn't crushed by flex shrinking. Both carry `px-1` so the inner
          img sits at x=28 (header px-6 + link px-1) in both branches. */}
      <div className="border-b border-base-300 flex items-center justify-between px-6 pt-8 pb-6 lg:pl-7">
        <Link
          href="/dashboard"
          className={`inline-flex items-center flex-shrink-0 rounded-sm px-1 ${
            collapsed ? 'lg:hidden' : ''
          }`}
        >
          <Wordmark size="md" />
        </Link>
        {collapsed && (
          <Link
            href="/dashboard"
            aria-label="kanNINJA dashboard"
            className="hidden lg:inline-flex lg:items-center flex-shrink-0 rounded-sm lg:ml-[-6px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/nin-icon.svg"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={onDrawerClose}
          className="lg:hidden btn btn-ghost btn-sm btn-square"
          aria-label="Close navigation"
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>
      </div>

      {/* Nav — NO-SHIFT collapse (Linear/Vercel pattern): link layout never
          changes; labels/eyebrows fade + shrink via max-width; the collapsed
          link is forced to lg:!w-10 so its hover bg is a symmetric pill inside
          the rail. Icons sit at x=32 (lg:pl-5 + lg:!px-3), matching the logo
          at x=32 (header lg:pl-7 + link px-1). */}
      <nav
        aria-label="Main"
        className="flex-1 px-4 py-8 overflow-y-auto lg:pl-5 lg:overflow-x-hidden"
      >
        <div className="flex flex-col gap-10">
          {NAV_GROUPS.map((group) => {
            const labelId = `nav-${group.eyebrow.toLowerCase()}`;
            // Labels/eyebrows fade + shrink max-width in sync with the width
            // animation so they don't bleed past the narrow collapsed pill.
            const fadeClass = `whitespace-nowrap overflow-hidden ${
              mounted
                ? 'lg:transition-[max-width,opacity] lg:duration-200 motion-reduce:lg:transition-none'
                : ''
            } ${collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-xs'}`;
            return (
              <div key={group.eyebrow}>
                <p
                  id={labelId}
                  className={`text-eyebrow font-mono uppercase text-base-content/60 px-3 mb-3 ${fadeClass}`}
                >
                  {group.eyebrow}
                </p>
                <ul
                  aria-labelledby={labelId}
                  className="menu menu-sm p-0 gap-1 w-full"
                >
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          title={collapsed ? item.label : undefined}
                          className={`gap-3 py-2.5 text-sm lg:!px-3 ${
                            collapsed ? 'lg:!w-10' : ''
                          } ${
                            active
                              ? 'menu-active font-medium'
                              : 'text-base-content/70 hover:text-base-content'
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={item.icon}
                            fixedWidth
                            aria-hidden="true"
                            className={`text-sm ${
                              active ? 'text-primary' : 'text-base-content/50'
                            }`}
                          />
                          <span className={fadeClass}>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer — user menu + theme switcher. Two UserDropdown copies: the
          full version is the only one shown in the mobile drawer (and on
          desktop when expanded); the compact avatar-only version is shown
          on desktop when collapsed. CSS gating keeps mobile rendering
          correct regardless of the persisted collapsed preference. */}
      <div
        className={`border-t border-base-300 p-3 flex items-center gap-2 ${
          collapsed ? 'lg:flex-col lg:items-center' : ''
        }`}
      >
        <div
          className={`flex-1 min-w-0 ${collapsed ? 'lg:hidden' : ''}`}
        >
          <UserDropdown />
        </div>
        {collapsed && (
          <div className="hidden lg:block">
            <UserDropdown compact />
          </div>
        )}
        <ThemeSwitcher />
      </div>
    </aside>
  );
}
