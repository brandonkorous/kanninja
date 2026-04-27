interface Props {
    intro: string;
}

export function PersonaIntro({ intro }: Props) {
    return (
        <section className="border-y border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                <div className="hanko-scroll-rise max-w-3xl">
                    <p className="text-xl md:text-2xl leading-snug text-base-content/80">
                        {intro}
                    </p>
                </div>
            </div>
        </section>
    );
}
