interface Props {
    competitor: string;
    pickThemIf: string[];
    pickUsIf: string[];
}

export function ComparisonHonesty({ competitor, pickThemIf, pickUsIf }: Props) {
    return (
        <section className="border-y border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        Pick the right tool
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Two real{' '}
                        <span className="italic text-primary">answers.</span>
                    </h2>
                    <p className="mt-6 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        We&rsquo;d rather you use the right tool than the one we sell. Here is
                        when each one is right.
                    </p>
                </div>

                <div className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 max-w-5xl">
                    <div>
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                            Pick {competitor} if
                        </p>
                        <ul className="mt-8 space-y-5">
                            {pickThemIf.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-baseline gap-4 text-base md:text-lg text-base-content/70"
                                >
                                    <span className="text-base-content/30 text-xs leading-none mt-1">
                                        ○
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Pick kanNINJA if
                        </p>
                        <ul className="mt-8 space-y-5">
                            {pickUsIf.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-baseline gap-4 text-base md:text-lg text-base-content"
                                >
                                    <span className="text-primary text-xs leading-none mt-1">
                                        ●
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
