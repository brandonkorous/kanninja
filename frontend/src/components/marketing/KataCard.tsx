import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// Bento-style feature card. Renders compact by default; pass `featured`
// for the tall left-anchor card with bigger type and more breathing room.
// Used by the marketing landing page's "four kata" section.
export function KataCard({
    number,
    icon,
    title,
    body,
    featured = false,
    className = '',
}: {
    number: string;
    icon: IconDefinition;
    title: string;
    body: string;
    featured?: boolean;
    className?: string;
}) {
    return (
        <article
            className={`hanko-scroll-rise hanko-lift bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 flex flex-col ${
                featured ? 'p-10 md:p-12' : 'p-8'
            } ${className}`}
        >
            <div className="flex items-baseline justify-between">
                <FontAwesomeIcon
                    icon={icon}
                    className={`text-primary ${featured ? 'text-3xl' : 'text-2xl'}`}
                />
                <span
                    className={`font-mono text-base-content/30 tracking-tight ${
                        featured ? 'text-2xl' : 'text-xl'
                    }`}
                >
                    {number}
                </span>
            </div>
            <h3
                className={`font-display font-medium tracking-tight ${
                    featured ? 'mt-auto pt-16 text-3xl md:text-4xl' : 'mt-10 text-2xl'
                }`}
            >
                {title}
            </h3>
            <p
                className={`leading-relaxed text-base-content/70 ${
                    featured ? 'mt-4 text-base' : 'mt-3 text-sm'
                }`}
            >
                {body}
            </p>
        </article>
    );
}
