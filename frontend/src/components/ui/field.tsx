// Field wrapper — label + control + helper + error as one unit.
//
// Canonical Hanko form label voice: mono caps eyebrow, `· optional` separator
// tag for optional fields (not parenthetical), small muted helper text below
// the control, vermillion-tinted error message with a left bar. Every form
// label in the app belongs to the same eyebrow family as the sidebar nav,
// column headers, and card meta rows.
//
// Usage:
//   <Field label="Name" htmlFor="name">
//     <Input id="name" value={name} onChange={...} required />
//   </Field>
//
//   <Field label="Description" htmlFor="desc" optional hint="One or two sentences.">
//     <Textarea id="desc" value={desc} onChange={...} />
//   </Field>
//
//   <Field label="Email" htmlFor="email" error={error}>
//     <Input id="email" type="email" value={email} onChange={...} />
//   </Field>

export function Field({
    label,
    htmlFor,
    optional,
    hint,
    error,
    labelRight,
    children,
}: {
    label: string;
    htmlFor: string;
    optional?: boolean;
    hint?: string;
    error?: string;
    /** Optional slot rendered inline with the label, right-aligned. Use for
     *  "forgot password" links or character counters that belong to the field. */
    labelRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const labelEl = (
        <label
            htmlFor={htmlFor}
            className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
        >
            {label}
            {optional && (
                <span className="text-base-content/30 ml-2">· optional</span>
            )}
        </label>
    );
    return (
        <div>
            {labelRight ? (
                <div className="flex items-baseline justify-between">
                    {labelEl}
                    {labelRight}
                </div>
            ) : (
                labelEl
            )}
            <div className="mt-2">{children}</div>
            {hint && !error && (
                <p className="mt-2 text-xs text-base-content/50 leading-relaxed">
                    {hint}
                </p>
            )}
            {error && (
                <p
                    role="alert"
                    className="mt-2 text-xs text-error border-l-2 border-error pl-3"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
