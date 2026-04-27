import type { PersonaUseCase } from './types';

interface Props {
    label: string;
    useCases: PersonaUseCase[];
}

export function PersonaUseCases({ label, useCases }: Props) {
    return (
        <section className="border-t border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="max-w-3xl">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                        How it earns its place
                    </p>
                    <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        What{' '}
                        <span className="italic text-primary">{label.toLowerCase()}</span>
                        {' '}
                        actually use it for.
                    </h2>
                </div>

                <ul className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 max-w-5xl">
                    {useCases.map((useCase) => (
                        <li key={useCase.title}>
                            <h3 className="font-display text-2xl font-medium tracking-tight">
                                {useCase.title}
                            </h3>
                            <p className="mt-3 text-base leading-relaxed text-base-content/70 max-w-md">
                                {useCase.body}
                            </p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
