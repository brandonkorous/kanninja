// The four principles. Mirror-rhymes with the four kata (landing) and the four
// refusals (landing) and the five tiers (pricing) — a deliberate quartet motif
// that becomes part of the brand's structural identity. Same typographic 2x2
// grid as the four refusals: pure type, no chrome, hairline rhythm.

const principles: { name: string; body: string }[] = [
    {
        name: 'Restraint.',
        body: 'We say no more often than yes. The features we don\'t build are the ones you don\'t have to learn. Every release is more no than yes.',
    },
    {
        name: 'Warmth.',
        body: 'The difference between a tool that respects you and one that processes you. We try to write like a person who likes the reader. Cold tools train cold habits.',
    },
    {
        name: 'Mastery.',
        body: 'The cursor blink. The focus ring. The way a dropdown closes. We measure the small things because the small things are what you feel.',
    },
    {
        name: 'Focus.',
        body: 'Your work, not our metrics. The screen should clear so you can see what is actually in front of you. The dashboard is not the work.',
    },
];

export function FourPrinciplesSection() {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        The four principles
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        What we <span className="italic text-primary">return to.</span>
                    </h2>
                    <p className="mt-6 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        When a decision is hard, we look here first. Four words. They tell us
                        almost everything.
                    </p>
                </div>
                <ul className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-14 max-w-5xl">
                    {principles.map((p) => (
                        <li key={p.name}>
                            <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
                                <span className="italic text-primary">{p.name}</span>
                            </h3>
                            <p className="mt-3 text-base leading-relaxed text-base-content/70 max-w-md">
                                {p.body}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
