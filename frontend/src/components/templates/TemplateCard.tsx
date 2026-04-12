'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

interface TemplateCardProps {
    name: string;
    description: string;
    lists: string[];
    onUse: () => void;
    disabled: boolean;
}

// Card representing a built-in board template on the templates page. The
// list-stages render as small caps mono tokens with → separators — a visual
// glyph of the kanban flow the template creates.

export function TemplateCard({
    name,
    description,
    lists,
    onUse,
    disabled,
}: TemplateCardProps) {
    return (
        <article className="bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 p-8 flex flex-col transition-shadow">
            <FontAwesomeIcon
                icon={faLayerGroup}
                className="text-primary text-xl"
                aria-hidden="true"
            />
            <h3 className="mt-8 font-display text-2xl font-medium tracking-tight">
                {name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-base-content/70 flex-1">
                {description}
            </p>
            <div className="mt-6 pt-4 border-t border-base-300">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60 mb-2">
                    Stages
                </p>
                <p className="text-xs font-mono text-base-content/60 leading-relaxed">
                    {lists.join(' → ')}
                </p>
            </div>
            <button
                type="button"
                className="btn btn-outline btn-secondary btn-sm mt-6"
                onClick={onUse}
                disabled={disabled}
            >
                Use this template
            </button>
        </article>
    );
}
