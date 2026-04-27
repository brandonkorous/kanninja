import type { PersonaFAQ } from './types';

interface Props {
    label: string;
    faqs: PersonaFAQ[];
}

export function PersonaFAQSection({ label, faqs }: Props) {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl mb-16">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        Real questions
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        What{' '}
                        <span className="italic text-primary">{label.toLowerCase()}</span>
                        {' '}
                        ask.
                    </h2>
                </div>
                <dl className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-5xl">
                    {faqs.map((item) => (
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
