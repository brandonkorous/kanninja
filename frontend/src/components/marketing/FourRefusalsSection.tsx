// "Things we threw out" — the four refusals. Mirror-rhymes with the four
// kata above: same quartet structure, opposite intent. Pure typography on
// the cream paper canvas — no cards, no chrome. The list of what kanNINJA
// refuses to do is the strongest signal of what it actually is.

const refusals: { headline: string; body: string }[] = [
    {
        headline: 'No notification storm.',
        body: "We don't ping you about things that aren't on fire.",
    },
    {
        headline: 'No vanity metrics.',
        body: 'Counting what does not change behavior is decoration.',
    },
    {
        headline: 'No AI of our own.',
        body: 'Bring the agent you already trust. We stay out of the way.',
    },
    {
        headline: 'No dashboards-of-dashboards.',
        body: 'Your work, not the appearance of work.',
    },
];

export function FourRefusalsSection() {
    return (
        <section>
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        The four refusals
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Things we <span className="italic text-primary">threw out.</span>
                    </h2>
                    <p className="mt-6 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        Every tool grows by accretion. We pruned. These are the four we
                        cut on purpose.
                    </p>
                </div>
                <ul className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-14 max-w-5xl">
                    {refusals.map((r) => (
                        <li key={r.headline}>
                            <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
                                {r.headline}
                            </h3>
                            <p className="mt-3 text-base leading-relaxed text-base-content/70 max-w-md">
                                {r.body}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
