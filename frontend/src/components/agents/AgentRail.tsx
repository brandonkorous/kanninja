'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface AgentPanel {
    id: string;
    number: string;
    icon: IconDefinition;
    label: string;
    body: string;
}

// Left rail for the Agents page. Lists the panels; the active one gets a
// vermillion left border and bolder title. Mirrors the mono-numeral +
// Fraunces-headline pattern used on the features page kata cards.

export function AgentRail({
    panels,
    active,
    onChange,
}: {
    panels: AgentPanel[];
    active: string;
    onChange: (id: string) => void;
}) {
    return (
        <nav aria-label="Agent setup" className="space-y-2">
            {panels.map((panel) => {
                const isActive = panel.id === active;
                return (
                    <button
                        key={panel.id}
                        type="button"
                        onClick={() => onChange(panel.id)}
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
                                {panel.number}
                            </span>
                            <FontAwesomeIcon
                                icon={panel.icon}
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
                                {panel.label}
                            </span>
                        </div>
                        <p className="mt-2 ml-9 text-xs leading-relaxed text-base-content/60">
                            {panel.body}
                        </p>
                    </button>
                );
            })}
        </nav>
    );
}
