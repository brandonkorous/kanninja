import type { ComparisonRow } from './types';

interface Props {
    competitor: string;
    rows: ComparisonRow[];
    coreDifference: string;
}

export function ComparisonTable({ competitor, rows, coreDifference }: Props) {
    return (
        <section>
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        Side by side
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Feature for{' '}
                        <span className="italic text-primary">feature.</span>
                    </h2>
                    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        {coreDifference}
                    </p>
                </div>

                <div className="hanko-scroll-rise mt-16 max-w-5xl bg-base-100 rounded-lg shadow-e1 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-base-300">
                                <th
                                    scope="col"
                                    className="text-left p-5 md:p-6 text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
                                >
                                    Feature
                                </th>
                                <th
                                    scope="col"
                                    className="text-left p-5 md:p-6 text-eyebrow font-mono uppercase tracking-widest text-primary"
                                >
                                    kanNINJA
                                </th>
                                <th
                                    scope="col"
                                    className="text-left p-5 md:p-6 text-eyebrow font-mono uppercase tracking-widest text-base-content/40"
                                >
                                    {competitor}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.feature}
                                    className="border-b border-base-300 last:border-b-0 align-top"
                                >
                                    <td className="p-5 md:p-6 font-display text-base md:text-lg font-medium tracking-tight text-base-content">
                                        {row.feature}
                                        {row.note && (
                                            <p className="mt-2 text-sm font-sans font-normal text-base-content/50 max-w-xs">
                                                {row.note}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-5 md:p-6 text-base text-base-content">
                                        {row.kanninja}
                                    </td>
                                    <td className="p-5 md:p-6 text-base text-base-content/60">
                                        {row.competitor}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
