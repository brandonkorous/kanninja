import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export const metadata: Metadata = {
    title: 'kanNINJA — Contact',
    description: 'How to reach us. One email, real humans.',
};

export default function ContactPage() {
    return (
        <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
                <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Contact
                </p>
                <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                    One inbox,{' '}
                    <span className="hanko-brush italic text-primary">real humans.</span>
                </h1>
                <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                    No tiered support queue. No chatbot that apologizes before it helps.
                    Email us directly and someone on the team will read it and reply.
                </p>

                <div className="hanko-rise hanko-rise-3 mt-16 bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                        Email
                    </p>
                    <a
                        href="mailto:hello@kanninja.com"
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
