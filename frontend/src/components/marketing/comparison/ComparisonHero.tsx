interface Props {
    competitor: string;
    competitorPositioning: string;
    heroSubtitle: string;
}

export function ComparisonHero({ competitor, competitorPositioning, heroSubtitle }: Props) {
    return (
        <section className="relative overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                <div className="max-w-4xl">
                    <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        kanNINJA vs {competitor}
                    </p>
                    <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                        Honest about{' '}
                        <span className="hanko-brush italic text-primary">
                            where each one wins.
                        </span>
                    </h1>
                    <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        {heroSubtitle}
                    </p>
                    <p className="hanko-rise hanko-rise-3 mt-6 max-w-2xl text-sm font-mono uppercase tracking-widest text-base-content/40">
                        {competitor} positions itself as &ldquo;{competitorPositioning}.&rdquo;
                    </p>
                </div>
            </div>
        </section>
    );
}
