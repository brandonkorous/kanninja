// Card list for the subprocessors page. Rendered as <article> cards inside a
// plain <div> grid (instead of <ul>/<li> + <dl>/<dt>/<dd>) so the inherited
// .legal-prose styles in globals.css don't fight with the card layout —
// list bullets and definition-list grids are scoped to prose semantics, and
// these cards aren't prose.
//
// Hanko surface stack: Snow card on Washi page, hairline border, e1 elevation.
// Each card pairs the purpose as a vermillion eyebrow with the vendor name in
// Fraunces, then a row-grid of label/value pairs in plain Inter.

export type Subprocessor = {
    name: string;
    purpose: string;
    data: string;
    location: string;
    privacyUrl: string;
};

const labelClass =
    'font-mono uppercase tracking-widest text-xs text-base-content/50';
const valueClass = 'text-base-content/80 leading-relaxed text-sm';

export function SubprocessorList({ items }: { items: Subprocessor[] }) {
    return (
        <div className="grid grid-cols-1 gap-4">
            {items.map((s) => (
                <article
                    key={s.name}
                    className="bg-base-100 border border-base-300 rounded-lg shadow-e1 p-6"
                >
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        {s.purpose}
                    </p>
                    <h3 className="mt-3 font-display text-xl font-medium text-base-content">
                        {s.name}
                    </h3>
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-[7rem_minmax(0,1fr)] gap-y-3 sm:gap-x-6 text-sm">
                        <span className={labelClass}>Data</span>
                        <span className={valueClass}>{s.data}</span>
                        <span className={labelClass}>Location</span>
                        <span className={valueClass}>{s.location}</span>
                        <span className={labelClass}>Privacy</span>
                        <span className={valueClass}>
                            <a
                                href={s.privacyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary focus-visible:shadow-focus rounded-sm"
                            >
                                {new URL(s.privacyUrl).hostname.replace(
                                    /^www\./,
                                    '',
                                )}
                            </a>
                        </span>
                    </div>
                </article>
            ))}
        </div>
    );
}
