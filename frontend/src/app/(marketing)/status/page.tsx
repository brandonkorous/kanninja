import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Status',
    description: 'Is kanNINJA working? Check the live status of the marketing site, app, API, and MCP server.',
    path: '/status',
    ogTitle: 'Is kanNINJA working?',
    ogEyebrow: 'kanNINJA · Status',
});

// Simple static status page. When we have real uptime monitoring this will
// read from the monitoring service — for now it reports "all systems go"
// unless we manually say otherwise. Honest and unflashy: a health check
// table, not a marketing dashboard pretending to be one.
const SYSTEMS = [
    { name: 'Marketing site', status: 'operational' },
    { name: 'App', status: 'operational' },
    { name: 'API', status: 'operational' },
    { name: 'Realtime presence', status: 'operational' },
    { name: 'MCP server', status: 'operational' },
    { name: 'File storage', status: 'operational' },
] as const;

export default function StatusPage() {
    const allGood = SYSTEMS.every((s) => s.status === 'operational');

    return (
        <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
                <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Status
                </p>
                <h1 className="mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                    {allGood ? (
                        <>
                            All systems are{' '}
                            <span className="hanko-brush italic text-primary">operational.</span>
                        </>
                    ) : (
                        <>
                            Something{' '}
                            <span className="hanko-brush italic text-primary">is off.</span>
                        </>
                    )}
                </h1>
                <p className="mt-10 text-lg leading-relaxed text-base-content/70">
                    When something breaks, we say so here before you have to ask.
                </p>
            </div>

            <section className="mt-20 max-w-3xl bg-base-100 rounded-lg shadow-e1 overflow-hidden">
                <ul>
                    {SYSTEMS.map((system) => {
                        const isOperational = system.status === 'operational';
                        return (
                            <li
                                key={system.name}
                                className="flex items-center justify-between px-6 py-5 border-b border-base-300 last:border-b-0"
                            >
                                <span className="text-base text-base-content">
                                    {system.name}
                                </span>
                                <span
                                    className={`inline-flex items-center gap-2 text-eyebrow font-mono uppercase tracking-widest ${
                                        isOperational ? 'text-primary' : 'text-error'
                                    }`}
                                >
                                    <FontAwesomeIcon
                                        icon={faCircleCheck}
                                        aria-hidden="true"
                                    />
                                    {system.status}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <div className="mt-20">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                    Back home
                </Link>
            </div>
        </section>
    );
}
