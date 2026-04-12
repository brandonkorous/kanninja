'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface AITool {
    id: string;
    number: string;
    icon: IconDefinition;
    label: string;
    body: string;
    placeholder: string | null;
}

// Left rail for the AI Hub page. Lists the available techniques; the active
// one gets a vermillion left border and bolder title. Mirrors the mono-numeral
// + Fraunces-headline pattern used on the features page kata cards.

export function AIToolRail({
    tools,
    active,
    onChange,
}: {
    tools: AITool[];
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <nav aria-label="AI techniques" className="space-y-2">
            {tools.map((tool) => {
                const isActive = tool.id === active;
                return (
                    <button
                        key={tool.id}
                        type="button"
                        onClick={() => onChange(tool.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`w-full text-left rounded-lg p-4 transition-colors focus-visible:shadow-focus ${
                            isActive
                                ? 'bg-base-100 shadow-e1 border-l-2 border-primary'
                                : 'hover:bg-base-100/60 border-l-2 border-transparent'
                        }`}
                    >
                        <div className="flex items-baseline gap-3">
                            <span
                                className={`font-mono text-xs tracking-tight ${
                                    isActive ? 'text-primary' : 'text-base-content/30'
                                }`}
                            >
                                {tool.number}
                            </span>
                            <FontAwesomeIcon
                                icon={tool.icon}
                                aria-hidden="true"
                                className={`text-sm ${
                                    isActive ? 'text-primary' : 'text-base-content/40'
                                }`}
                            />
                            <span
                                className={`font-display text-base font-medium tracking-tight ${
                                    isActive ? 'text-base-content' : 'text-base-content/70'
                                }`}
                            >
                                {tool.label}
                            </span>
                        </div>
                        <p className="mt-2 ml-9 text-xs leading-relaxed text-base-content/60">
                            {tool.body}
                        </p>
                    </button>
                );
            })}
        </nav>
    );
}
