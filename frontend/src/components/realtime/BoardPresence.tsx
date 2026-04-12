'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import type { PresenceUser, RealtimeStatus } from '@/hooks/use-realtime-board';

// Cap visible avatars — above this we collapse to a "+N" badge so the
// dojo header stays balanced regardless of how many clanmates are here.
const MAX_VISIBLE = 5;

// Base stagger for the hanko-rise-tight cascade. Each avatar rises 60ms
// after the previous, like a calligraphic brush laying down strokes.
const STAGGER_MS = 60;
const BASE_DELAY_MS = 80;

export function BoardPresence({
    users,
    status,
}: {
    users: PresenceUser[];
    status: RealtimeStatus;
}) {
    // Channel dropped — be honest about it. This is the one case where the
    // component intrudes on the happy-path header. Solo training is silent.
    if (status === 'disconnected') {
        return (
            <div
                className="flex items-center gap-2"
                role="status"
                aria-live="polite"
            >
                <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-error animate-pulse"
                    aria-hidden="true"
                />
                <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                    Reconnecting
                </span>
            </div>
        );
    }

    // Solo, or still handshaking — no signal to send. The absence IS the
    // answer: nothing here means nothing to report.
    if (users.length === 0) return null;

    const visible = users.slice(0, MAX_VISIBLE);
    const overflow = users.length - MAX_VISIBLE;
    const count = users.length;

    return (
        <div
            className="flex items-center gap-3"
            role="status"
            aria-live="polite"
            aria-label={`${count} ${count === 1 ? 'clanmate' : 'clanmates'} in the dojo`}
        >
            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 leading-none">
                {count === 1 ? '1 other' : `${count} others`}
                <span className="ml-1.5 font-display italic text-primary text-sm normal-case tracking-normal">
                    training
                </span>
            </p>
            <div className="flex -space-x-2">
                {visible.map((user, i) => (
                    <div
                        key={user.userId}
                        className="avatar placeholder tooltip hanko-rise-tight"
                        data-tip={user.displayName}
                        style={{ animationDelay: `${BASE_DELAY_MS + i * STAGGER_MS}ms` }}
                    >
                        <div className="bg-base-200 text-base-content/70 rounded-full w-8 h-8 ring-2 ring-base-100 shadow-e1 overflow-hidden">
                            {user.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="text-xs"
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    </div>
                ))}
                {overflow > 0 && (
                    <div
                        className="avatar placeholder hanko-rise-tight"
                        style={{
                            animationDelay: `${BASE_DELAY_MS + visible.length * STAGGER_MS}ms`,
                        }}
                    >
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 ring-2 ring-base-100 shadow-e1">
                            <span className="text-xs font-mono">+{overflow}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
