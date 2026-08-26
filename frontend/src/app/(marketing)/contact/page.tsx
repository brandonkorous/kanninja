import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Contact',
    description: 'How to reach kanNINJA. One email, real humans. hello@kanninja.com.',
    path: '/contact',
    ogTitle: 'One email, real humans.',
    ogEyebrow: 'kanNINJA · Contact',
});

interface CopyBlock {
    eyebrow: string;
    headlineLead: string;
    headlineAccent: string;
    body: string;
    subject?: string;
    detail?: string;
}

const GENERAL: CopyBlock = {
    eyebrow: 'Contact',
    headlineLead: 'One inbox,',
    headlineAccent: 'real humans.',
    body: 'No tiered support queue. No chatbot that apologizes before it helps. Email us directly and someone on the team will read it and reply.',
};

// There is no Enterprise tier, and this block must not imply one. SSO, SCIM
// and data residency are not built, and SOC 2 is not paid for — promising any
// of them here would be the same fiction the five-tier grid was telling.
const ENTERPRISE: CopyBlock = {
    eyebrow: 'Bigger than this',
    headlineLead: 'Tell us what',
    headlineAccent: "you're moving.",
    body: 'There are two plans and no sales team, which suits almost everyone. If your rollout needs something neither plan covers, say so plainly and we will tell you honestly whether it exists yet.',
    subject: 'Larger rollout',
    detail: 'Helpful to include: team size, what you need that the Clan plan does not do, and when you need it. We would rather say no early than sell you a roadmap.',
};

export default async function ContactPage({
    searchParams,
}: {
    searchParams: Promise<{ topic?: string }>;
}) {
    const { topic } = await searchParams;
    const copy = topic === 'enterprise' ? ENTERPRISE : GENERAL;
    const mailto = copy.subject
        ? `mailto:hello@kanninja.com?subject=${encodeURIComponent(copy.subject)}`
        : 'mailto:hello@kanninja.com';

    return (
        <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
                <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    {copy.eyebrow}
                </p>
                <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                    {copy.headlineLead}{' '}
                    <span className="hanko-brush italic text-primary">{copy.headlineAccent}</span>
                </h1>
                <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                    {copy.body}
                </p>

                <div className="hanko-rise hanko-rise-3 mt-16 bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                        Email
                    </p>
                    <a
                        href={mailto}
                        className="mt-4 inline-flex items-center gap-3 font-display text-2xl md:text-3xl font-medium tracking-tight text-base-content hover:text-primary transition-colors focus-visible:shadow-focus rounded-sm"
                    >
                        <FontAwesomeIcon
                            icon={faEnvelope}
                            aria-hidden="true"
                            className="text-primary"
                        />
                        hello@kanninja.com
                    </a>
                    <p className="mt-6 text-sm text-base-content/60">
                        We read every message. Most get a reply within a day.
                    </p>
                    {copy.detail && (
                        <p className="mt-6 pt-6 border-t border-base-300/60 text-sm text-base-content/70 leading-relaxed">
                            {copy.detail}
                        </p>
                    )}
                </div>

                <div className="mt-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                        Back home
                    </Link>
                </div>
            </div>
        </section>
    );
}
