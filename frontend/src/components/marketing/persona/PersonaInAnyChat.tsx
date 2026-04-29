import Link from 'next/link';

interface Props {
    label: string;
}

/**
 * Cross-cutting callout that appears on every /for/<slug> page, between the
 * use-cases block and the FAQ. Promotes the chat-driven entry point: same
 * boards, same kata, but driven from Claude / ChatGPT instead of the app.
 *
 * The headline pulls in the persona's label so the reader sees themselves
 * named ("For moms, in any chat.") — single shared copy, persona-aware.
 */
export function PersonaInAnyChat({ label }: Props) {
    const lowered = label.toLowerCase();

    return (
        <section className="border-t border-base-300 bg-base-100">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-20 lg:py-24">
                <div className="hanko-scroll-rise max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Also from your chat
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        For {lowered},{' '}
                        <span className="italic text-primary">in any chat.</span>
                    </h2>
                    <p className="mt-8 text-lg leading-relaxed text-base-content/70">
                        Open Claude or ChatGPT, ask in plain language, kanNINJA does the
                        rest. The same board, the same kata, the same clan — driven from
                        the chat you already use.
                    </p>
                    <Link
                        href="/in-any-chat"
                        className="mt-10 inline-flex btn btn-outline btn-secondary focus-visible:shadow-focus"
                    >
                        See how it works
                    </Link>
                </div>
            </div>
        </section>
    );
}
