// Reusable deep-dive section for the features page. Each of the four kata
// (Honed reflexes, Live presence, The agent is yours, Honest signal) gets its
// own instance with its own number, headline, intro, and feature list. The
// agent kata is the exception — it uses AgentToolsSection because the example
// asks want a numbered grid instead of a feature list.

export function KataDeepdiveSection({
    number,
    kataName,
    headlineBefore,
    headlineItalic,
    intro,
    features,
}: {
    number: string;
    kataName: string;
    headlineBefore: string;
    headlineItalic: string;
    intro: string;
    features: { name: string; body: string }[];
}) {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        {number} — {kataName}
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                        {headlineBefore}{' '}
                        <span className="italic text-primary">{headlineItalic}</span>
                    </h2>
                    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        {intro}
                    </p>
                </div>
                <ul className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-5xl">
                    {features.map((f) => (
                        <li key={f.name}>
                            <h3 className="font-display text-2xl font-medium tracking-tight">
                                {f.name}
                            </h3>
                            <p className="mt-3 text-base leading-relaxed text-base-content/70 max-w-md">
                                {f.body}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
