// Kata 03 — the AI section. Special case of KataDeepdiveSection because the
// twelve techniques are numbered 1–12 and want a denser grid than the other
// kata sections. The "one rule" headline is the strongest single move on
// the page: the rule is that the model suggests and the user decides.

const TECHNIQUES: { name: string; body: string }[] = [
    { name: 'Parse a task.', body: 'Type a paragraph; get a structured card.' },
    {
        name: 'Suggest the next move.',
        body: 'Looks at the board state and proposes the obvious next step.',
    },
    { name: 'Generate a board.', body: 'Describe a goal; get a board to start from.' },
    {
        name: 'Suggest a due date.',
        body: 'Based on what is already on the card and what is around it.',
    },
    {
        name: 'Decompose a goal.',
        body: 'Break a big thing into small things you will actually finish.',
    },
    {
        name: 'Find dependencies.',
        body: 'Spot what blocks what before the deadline does.',
    },
    {
        name: 'Balance the load.',
        body: 'Who has been quiet, who is drowning. Both surfaced before standup.',
    },
    {
        name: 'Pull tasks from notes.',
        body: 'Paste your meeting notes; get the action items.',
    },
    {
        name: 'Daily briefing.',
        body: 'Two paragraphs about what you are walking into today.',
    },
    {
        name: 'Spot patterns.',
        body: 'Where the work actually happens — and where it stalls.',
    },
    {
        name: 'Spot risks.',
        body: 'The cards that are quietly sliding past the deadline.',
    },
    {
        name: 'Speak a task.',
        body: "Voice memo to a card. Useful when you are walking and don't want to forget.",
    },
];

export function AiTechniquesSection() {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        03 — AI as second
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight">
                        Twelve techniques.{' '}
                        <span className="italic text-primary">One rule.</span>
                    </h2>
                    <p className="mt-8 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        The rule: the model suggests, you decide. In that order. The twelve
                        techniques below are gated to the Pro tier and above.
                    </p>
                </div>
                <ol className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                    {TECHNIQUES.map((t, i) => (
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
