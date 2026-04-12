// Pricing FAQ. Real questions, honest answers. Each answer admits something
// the corporate voice would hide — that's how trust gets built. The questions
// are sentences, not labels (per the hanko-voice rule on section headers).

const FAQS: { q: string; a: string }[] = [
    {
        q: 'What happens when I hit my seat limit?',
        a: "Add seats by upgrading the tier. Your boards stay where they are. Nobody loses access mid-week.",
    },
    {
        q: 'Can I downgrade later?',
        a: "Yes. The features you upgraded for stop working at the next billing cycle. Your data stays put.",
    },
    {
        q: 'Where does the AI run?',
        a: "Routed to OpenAI's gpt-4o-mini. We never train models on your data. We don't log what you ask.",
    },
    {
        q: 'Do you import from other kanban tools?',
        a: "Not yet. Import is real work and we'd rather build the things you came here for first. For now, the manual copy from your old board is two evenings of work — we won't pretend otherwise.",
    },
    {
        q: 'Is there a yearly discount?',
        a: 'Two months free if you pay annually. That is the discount. No coupons, no founder badges, no first-year-only pricing.',
    },
    {
        q: 'Can I self-host?',
        a: "Not yet. The whole product is months old. The infrastructure to make it self-hostable is real work and it is not the next thing on the list.",
    },
];

export function PricingFAQ() {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl mb-16">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        Real questions
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        What people <span className="italic text-primary">actually ask.</span>
                    </h2>
                </div>
                <dl className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-5xl">
                    {FAQS.map((item) => (
                        <div key={item.q}>
                            <dt className="font-display text-xl md:text-2xl font-medium tracking-tight">
                                {item.q}
                            </dt>
                            <dd className="mt-3 text-base leading-relaxed text-base-content/70">
                                {item.a}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
