import type { PersonaSampleColumn } from './types';

interface Props {
    title: string;
    columns: PersonaSampleColumn[];
}

export function PersonaSampleBoard({ title, columns }: Props) {
    return (
        <section>
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        Sample board
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        {title}
                    </h2>
                </div>

                {/* Horizontally scrolling board, mirrors the real product on mobile.
                  * The negative margins + matching padding let the lane bleed to
                  * the viewport edge so the snap-scroll feels right on a phone. */}
                <div className="hanko-scroll-rise mt-16 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16">
                    <div className="flex gap-6 min-w-max">
                        {columns.map((column) => (
                            <div
                                key={column.name}
                                className="w-72 shrink-0 snap-start bg-base-100 rounded-lg shadow-e1 p-5"
                            >
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                    {column.name}
                                </p>
                                <ul className="mt-6 space-y-3">
                                    {column.cards.map((card, idx) => (
                                        <li
                                            key={idx}
                                            className="bg-base-200 rounded-md p-4 text-sm text-base-content leading-snug"
                                        >
                                            {card}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="mt-8 text-sm text-base-content/50 max-w-xl">
                    A real board, not a screenshot. Yours will look different — that&rsquo;s the
                    point.
                </p>
            </div>
        </section>
    );
}
