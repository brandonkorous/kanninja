'use client';

import Link from 'next/link';
import { useAuditLogs } from '@/hooks/use-analytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function AuditPage() {
    const { data: logs, error, isLoading } = useAuditLogs();

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <header className="mb-16">
                <Link
                    href="/analytics"
                    className="inline-flex items-center gap-2 text-eyebrow font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                    Back to analytics
                </Link>
                <p className="mt-4 text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Audit log · Business+
                </p>
                <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                    Every change,{' '}
                    <span className="italic text-primary">with a name on it.</span>
                </h1>
                <p className="mt-4 text-base text-base-content/60 max-w-xl">
                    Who did what, and when. Required for some teams. Quiet for the rest.
                </p>
            </header>

            <section aria-label="Audit log">
                {/* Loading */}
                {isLoading && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                    >
                        Reading the log…
                    </p>
                )}

                {/* Error — usually tier-gating, but the message comes
                  * straight from the backend so a real network error
                  * tells the user something specific too. */}
                {error && (
                    <div
                        role="alert"
                        className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl"
                    >
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                            Not available on your tier
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            Audit log is a{' '}
                            <span className="italic text-primary">Business feature.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">{error.message}</p>
                        <Link
                            href="/pricing"
                            className="btn btn-outline btn-secondary mt-8"
                        >
                            See the tiers
                        </Link>
                    </div>
                )}

                {/* Empty state */}
                {logs && logs.length === 0 && (
                    <div className="bg-base-100 rounded-lg shadow-e1 p-12 max-w-xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                            Nothing to log
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            The log is{' '}
                            <span className="italic text-primary">empty.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            As soon as the first change happens, it appears here.
                        </p>
                    </div>
                )}

                {/* Log table */}
                {logs && logs.length > 0 && (
                    <div className="bg-base-100 rounded-lg shadow-e1 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-base-300">
                                        <th className="text-left py-4 px-6 text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                            When
                                        </th>
                                        <th className="text-left py-4 px-6 text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                            Action
                                        </th>
                                        <th className="text-left py-4 px-6 text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                            Resource
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b border-base-300/60 last:border-b-0 hover:bg-base-200/40 transition-colors"
                                        >
                                            <td className="py-4 px-6 text-xs text-base-content/70 font-mono whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-base-content font-mono">
                                                {log.actionType}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-base-content/70">
                                                {log.tableName ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
