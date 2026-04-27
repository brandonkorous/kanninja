'use client';

// Shared chrome for every AI Hub workspace: eyebrow + heading + body lede.
// Each tool's workspace renders its own input + result inside `children`.
// Lives separately so the four workspaces stay tight (under 200 lines)
// and visually consistent.

export function WorkspaceShell({
    number,
    label,
    body,
    children,
}: {
    number: string;
    label: string;
    body: string;
    children: React.ReactNode;
}) {
    return (
        <section
            aria-label="Technique workspace"
            className="bg-base-100 rounded-lg shadow-e1 p-8"
        >
            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                {number} — technique
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">
                {label}
            </h2>
            <p className="mt-3 text-sm text-base-content/70">{body}</p>
            {children}
        </section>
    );
}

export function WorkspaceError({ message }: { message: string }) {
    return (
        <div role="alert" className="mt-10 border-t border-base-300 pt-8">
            <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                Something on our end
            </p>
            <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
                The model went quiet.
            </h3>
            <p className="mt-3 text-sm text-base-content/70">{message}</p>
        </div>
    );
}

export function WorkspaceFooter({ children }: { children: React.ReactNode }) {
    return <div className="mt-8 flex flex-wrap items-center justify-end gap-3">{children}</div>;
}
