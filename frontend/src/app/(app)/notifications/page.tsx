'use client';

import { useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons';

// Formats a notification timestamp as a brief human phrase. Same approach as
// BoardCard's formatUpdated — relative for the last week, terse date beyond.
function formatWhen(iso: string): string {
    const then = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
    const { data: notifications, isLoading, error, refetch, isFetching } = useNotifications();
    const markRead = useMarkRead();
    const markAllRead = useMarkAllRead();

    const unread = notifications?.filter((n) => !n.read) ?? [];
    const subtitle = notifications?.length
        ? unread.length > 0
            ? `${unread.length} unread of ${notifications.length}`
            : `${notifications.length} read · nothing pending`
        : 'Nothing waiting.';

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Notifications
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        What&rsquo;s{' '}
                        <span className="italic text-primary">on fire.</span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60">{subtitle}</p>
                </div>
                {unread.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-outline btn-secondary btn-sm"
                        onClick={() => markAllRead.mutate()}
                    >
                        <FontAwesomeIcon icon={faCheckDouble} aria-hidden="true" className="mr-2" />
                        Mark all read
                    </button>
                )}
            </div>

            <section aria-label="Notifications">
                {/* Loading */}
                {isLoading && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                    >
                        Reading the queue…
                    </p>
                )}

                {/* Error — announced to assistive tech + retry */}
                {error && (
                    <div
                        role="alert"
                        className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl"
                    >
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                            Something on our end
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            We couldn&rsquo;t load your{' '}
                            <span className="italic text-primary">notifications.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            {error.message || 'The backend didn\u2019t answer. Try again in a moment.'}
                        </p>
                        <button
                            type="button"
                            className="btn btn-secondary mt-6"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            {isFetching ? 'Trying…' : 'Try again'}
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {notifications?.length === 0 && (
                    <div className="bg-base-100 rounded-lg shadow-e1 p-12 max-w-xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                            Empty
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            Nothing <span className="italic text-primary">on fire.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            We only ping you about things worth looking at.
                        </p>
                    </div>
                )}

                {/* List */}
                {notifications && notifications.length > 0 && (
                    <ul className="bg-base-100 rounded-lg shadow-e1 overflow-hidden">
                        {notifications.map((n) => (
                            <li
                                key={n.id}
                                className={`group flex items-start gap-4 px-6 py-5 border-b border-base-300 last:border-b-0 transition-colors ${
                                    !n.read ? 'bg-primary/5' : 'hover:bg-base-200/40'
                                }`}
                            >
                                {/* Unread dot */}
                                <div className="pt-2 shrink-0">
                                    {!n.read ? (
                                        <span
                                            className="block w-2 h-2 rounded-full bg-primary"
                                            aria-label="Unread"
                                        />
                                    ) : (
                                        <span className="block w-2 h-2" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <h3
                                            className={`font-display text-lg font-medium tracking-tight ${
                                                n.read ? 'text-base-content/70' : 'text-base-content'
                                            }`}
                                        >
                                            {n.title}
                                        </h3>
                                        <span className="text-eyebrow font-mono text-base-content/60 shrink-0">
                                            {formatWhen(n.createdAt)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-base-content/70 leading-relaxed">
                                        {n.message}
                                    </p>
                                </div>
                                {!n.read && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm md:btn-xs text-base-content/40 hover:text-primary focus-visible:text-primary shrink-0"
                                        onClick={() => markRead.mutate(n.id)}
                                        aria-label={`Mark "${n.title}" as read`}
                                    >
                                        <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
