'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient, useSession } from '@/lib/auth-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faGear,
  faCreditCard,
  faRightFromBracket,
  faChevronUp,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useConsent } from '@/providers/ConsentProvider';

type Placement = 'top-start' | 'bottom-end';

export function UserDropdown({
  compact = false,
  placement = 'top-start',
}: {
  compact?: boolean;
  placement?: Placement;
}) {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const { openPreferences } = useConsent();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape — proper dismissal, not CSS :focus-within.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isPending || !user) {
    return (
      <div
        className={
          compact
            ? 'skeleton h-12 w-12 rounded-full'
            : 'skeleton h-14 w-full rounded-md'
        }
      />
    );
  }

  // Better Auth stores one `name` field rather than Clerk's first/last pair,
  // so initials come from splitting it: "Aiko Tanaka" -> AT, "Aiko" -> A.
  const fullName = user.name?.trim() || 'Account';
  const email = user.email ?? '';
  const nameParts = fullName === 'Account' ? [] : fullName.split(/\s+/);
  const initials =
    [nameParts[0]?.[0], nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : undefined]
      .filter(Boolean)
      .join('')
      .toUpperCase() || 'U';

  const handleSignOut = async () => {
    setOpen(false);
    await authClient.signOut();
    router.push('/sign-in');
    router.refresh();
  };

  return (
    <div ref={rootRef} className={compact ? 'relative' : 'relative w-full'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        aria-label={compact ? fullName : undefined}
        title={compact ? fullName : undefined}
        className={
          compact
            ? 'btn btn-ghost btn-square w-12 h-12 p-0'
            : 'w-full flex items-center gap-3 rounded-md p-3 hover:bg-base-200 transition-colors text-left'
        }
      >
        <div className={`avatar ${user.image ? '' : 'placeholder'}`}>
          <div className="bg-base-300 text-base-content rounded-full w-10 h-10">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <span className="text-sm font-medium">{initials}</span>
            )}
          </div>
        </div>
        {!compact && (
          <>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate text-base-content"
                title={fullName}
              >
                {fullName}
              </p>
              {email && (
                <p
                  className="text-xs text-base-content/70 truncate"
                  title={email}
                >
                  {email}
                </p>
              )}
            </div>
            <FontAwesomeIcon
              icon={faChevronUp}
              aria-hidden="true"
              className={`text-xs text-base-content/60 transition-transform ${
                open ? '' : 'rotate-180'
              }`}
            />
          </>
        )}
      </button>

      {open && (
        <div
          id="user-menu-panel"
          className={`absolute z-50 min-w-56 bg-base-100 border border-base-300 rounded-lg shadow-e3 overflow-hidden ${
            placement === 'bottom-end'
              ? 'top-full right-0 mt-2'
              : compact
                ? 'bottom-full left-0 mb-2'
                : 'bottom-full left-0 right-0 mb-2'
          }`}
        >
          <ul className="menu p-2 w-full">
            <li>
              <Link href="/profile" onClick={() => setOpen(false)}>
                <FontAwesomeIcon
                  icon={faUser}
                  aria-hidden="true"
                  className="text-base-content/60"
                />
                Profile
              </Link>
            </li>
            <li>
              <Link href="/settings" onClick={() => setOpen(false)}>
                <FontAwesomeIcon
                  icon={faGear}
                  aria-hidden="true"
                  className="text-base-content/60"
                />
                Settings
              </Link>
            </li>
            <li>
              <Link href="/settings#subscription" onClick={() => setOpen(false)}>
                <FontAwesomeIcon
                  icon={faCreditCard}
                  aria-hidden="true"
                  className="text-base-content/60"
                />
                Billing
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openPreferences();
                }}
              >
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  aria-hidden="true"
                  className="text-base-content/60"
                />
                Privacy choices
              </button>
            </li>
            <li role="separator" className="border-t border-base-300 my-2" />
            <li>
              <button type="button" onClick={handleSignOut}>
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  aria-hidden="true"
                  className="text-base-content/60"
                />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
