// Kata 03 — the agent section. Special case of KataDeepdiveSection because
// the examples want a denser grid than the other kata sections. The headline
// is the strongest single move on the page: we removed our AI on purpose.
//
// Each row maps to real MCP tools — see mcp-server/src/tools/.

const ASKS: { name: string; body: string }[] = [
    {
        name: '“File these notes.”',
        body: 'Your meeting notes land as kata, on the columns where they belong.',
    },
    {
        name: '“What am I walking into?”',
        body: 'Every kata assigned to you, across every dojo, in one answer.',
    },
    {
        name: '“Break this goal down.”',
        body: 'A whole dojo — columns and starter kata — built in a single call.',
    },
    {
        name: '“Push everything blocked to Friday.”',
        body: 'Bulk edits land whole or not at all. No half-moved board.',
    },
    {
        name: '“What is slipping?”',
        body: 'Due dates and progress, read off the board and said plainly.',
    },
    {
        name: '“Set this up like last quarter.”',
        body: 'A template stamped onto an existing dojo, in one transaction.',
    },
    {
        name: '“Who is drowning?”',
        body: 'Assignees and load, counted from the kata rather than guessed.',
    },
    {
        name: '“Log what I just did.”',
        body: 'A kata, a comment, a checked-off step. Posted as you, not as a bot.',
    },
    {
        name: '“Find the card about billing.”',
        body: 'Search across kata and comments, scoped to what you can already see.',
    },
];

export function AgentToolsSection() {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        03 — The agent is yours
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                        We took the AI out.{' '}
                        <span className="italic text-primary">On purpose.</span>
                    </h2>
                    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        Every other board is bolting on an assistant you have to learn.
                        We removed ours. Connect the agent you already pay for — Claude,
                        ChatGPT, Cursor, whatever you already talk to — and it gets 42
                        tools on your boards. You keep the words you already use.
                    </p>
                </div>
                <ol className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                    {ASKS.map((t, i) => (
                        <li key={t.name}>
                            <div className="flex items-baseline gap-4">
                                <span className="font-mono text-base text-base-content/30 tracking-tight">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <h3 className="font-display text-xl font-medium tracking-tight">
                                    {t.name}
                                </h3>
                            </div>
                            <p className="mt-2 ml-10 text-sm leading-relaxed text-base-content/70">
                                {t.body}
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
