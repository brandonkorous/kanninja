import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

// Full feature × tier comparison. Hairline borders, no fills, no zebra stripes.
// Mono numbers for quantitative cells, vermillion checkmarks for boolean cells,
// muted dash for absences. The table itself is the design — no chrome.
const TIER_NAMES = ['Starter', 'Essentials', 'Pro', 'Business', 'Enterprise'] as const;

const ROWS: { label: string; values: (string | boolean)[] }[] = [
    { label: 'Seats', values: ['3', '10', '10', '50', '100'] },
    { label: 'File storage', values: ['100 MB', '1 GB', '2 GB', '10 GB', '20 GB'] },
    { label: 'Boards', values: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
    { label: 'Real-time presence', values: [true, true, true, true, true] },
    { label: 'Project templates', values: [false, true, true, true, true] },
    { label: '12 AI techniques', values: [false, false, true, true, true] },
    { label: 'Custom branding', values: [false, false, false, true, true] },
    { label: 'Single sign-on', values: [false, false, false, true, true] },
    { label: 'Audit log', values: [false, false, false, true, true] },
    { label: 'Priority support', values: [false, false, false, true, true] },
    { label: 'Dedicated CSM', values: [false, false, false, false, true] },
];

function renderCell(v: string | boolean) {
    if (v === true) {
        return <FontAwesomeIcon icon={faCheck} className="text-primary" />;
    }
    if (v === false) {
        return <span className="text-base-content/20">—</span>;
    }
    return <span className="font-mono text-sm">{v}</span>;
}

export function FeatureComparisonTable() {
    return (
        <section>
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl mb-16">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        The full grid
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Every line, <span className="italic text-primary">every tier.</span>
                    </h2>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-base-content/70">
                        No surprises behind a sales call. The whole feature set on one page.
                    </p>
                </div>
                <div className="overflow-x-auto -mx-6 md:-mx-12 lg:-mx-16 px-6 md:px-12 lg:px-16">
                    <table className="hanko-scroll-rise w-full min-w-[720px] border-collapse">
                        <thead>
                            <tr className="border-b border-base-300">
                                <th className="text-left py-5 pr-6 text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                    Feature
                                </th>
                                {TIER_NAMES.map((name) => (
                                    <th
                                        key={name}
                                        className="text-left py-5 px-4 text-eyebrow font-mono uppercase tracking-widest text-base-content/40 min-w-[120px]"
                                    >
                                        {name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ROWS.map((row) => (
                                <tr key={row.label} className="border-b border-base-300/60">
                                    <td className="py-5 pr-6 text-sm text-base-content">{row.label}</td>
                                    {row.values.map((v, i) => (
                                        <td key={i} className="py-5 px-4 text-base-content/80">
                                            {renderCell(v)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
