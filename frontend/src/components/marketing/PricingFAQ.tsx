// Pricing FAQ. Real questions, honest answers. Each answer admits something
// the corporate voice would hide — that's how trust gets built. The questions
// are sentences, not labels (per the hanko-voice rule on section headers).
//
// Exported so the pricing page can render the same Q&As as FAQPage JSON-LD,
// keeping the on-page text and the structured data in sync.

export const PRICING_FAQS: { q: string; a: string }[] = [
    {
        q: 'Why is the paid plan called "Clan"?',
        a: "A clan is the group you share boards with, and a seat is one person in it — so the plan is named after the thing you are actually buying. Everyone else calls this tier Pro, which tells you nothing.",
    },
    {
        q: 'Where is the AI?',
        a: "There isn't one, and that's deliberate. kanNINJA used to ship its own assistant; we took it out. You already pay for an agent that is better than anything we would run on a $10 plan, so we gave it 42 tools instead and got out of the way.",
    },
    {
        q: 'Why only two tiers?',
        a: "Because we could only defend two. The old grid sold five tiers on eight differences, and six of those were never enforced anywhere in the product — single sign-on was a checkbox with nothing behind it. Rather than build four features to justify a price list, we deleted the price list.",
    },
    {
        q: 'What happens when I add someone?',
        a: "On the Clan plan there is no seat limit — a new person is another $12 on the next invoice, and removing them takes it back off. Free stops at 10 seats, which is more than most households and soccer teams ever need. Either way your boards stay where they are and nobody loses access mid-week.",
    },
    {
        q: 'Can I go back to Free?',
        a: "Yes, at the next billing cycle. If you are over 10 seats you will need to remove people first — we will not delete anyone for you. Your boards stay put either way.",
    },
    {
        q: 'Do you send my boards to a model?',
        a: "No. We run no reasoning models, so nothing goes to an LLM unless your own agent reads it — and then it goes to the provider you already chose. The one exception is voice capture, which sends the audio clip to Azure OpenAI to turn it into text, and nothing else.",
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
                    {PRICING_FAQS.map((item) => (
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
