interface Props {
    eyebrow: string;
    headlineBefore: string;
    headlineItalic: string;
    subtitle: string;
}

export function PersonaHero({ eyebrow, headlineBefore, headlineItalic, subtitle }: Props) {
    return (
        <section className="relative overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                <div className="max-w-4xl">
                    <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        {eyebrow}
                    </p>
                    <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                        {headlineBefore}{' '}
                        <span className="hanko-brush italic text-primary">
                            {headlineItalic}
                        </span>
                    </h1>
                    <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        {subtitle}
                    </p>
                </div>
            </div>
        </section>
    );
}
