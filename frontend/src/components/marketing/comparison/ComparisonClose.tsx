import Link from 'next/link';

interface Props {
    competitor: string;
}

export function ComparisonClose({ competitor }: Props) {
    return (
        <section className="bg-neutral text-neutral-content">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                    <div className="max-w-2xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            Try the other answer
                        </p>
                        <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                            One kata away from{' '}
                            <span className="italic text-primary">leaving {competitor}.</span>
                        </h2>
                        <p className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-content/70">
                            Free until you outgrow it. Most people never do.
                        </p>
                        <div className="mt-12 flex flex-wrap items-center gap-6">
                            <Link
                                href="/sign-up"
                                className="btn btn-primary focus-visible:shadow-focus"
                            >
                                Start a kata
                            </Link>
                            <Link
                                href="/pricing"
                                className="text-sm font-mono uppercase tracking-widest text-neutral-content/70 hover:text-neutral-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                            >
                                See pricing
                            </Link>
                        </div>
                    </div>
                    <img
                        src="/brand/nin-icon.svg"
                        alt="kanNINJA vermillion 忍 seal — the brand stamp"
                        width={288}
                        height={288}
                        className="hidden md:block h-48 w-48 lg:h-64 lg:w-64 xl:h-72 xl:w-72"
                    />
                </div>
            </div>
        </section>
    );
}
