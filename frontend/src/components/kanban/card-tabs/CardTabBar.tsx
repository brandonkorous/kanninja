'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faComments,
    faListCheck,
    faTags,
    faClock,
    faPaperclip,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

export type CardTab = 'details' | 'comments' | 'checklist' | 'labels' | 'time' | 'attachments';

const TABS: { id: CardTab; label: string; icon: IconDefinition }[] = [
    { id: 'details', label: 'Details', icon: faInfoCircle },
    { id: 'comments', label: 'Comments', icon: faComments },
    { id: 'checklist', label: 'Checklist', icon: faListCheck },
    { id: 'labels', label: 'Labels', icon: faTags },
    { id: 'time', label: 'Time', icon: faClock },
    { id: 'attachments', label: 'Files', icon: faPaperclip },
];

export function CardTabBar({
    active,
    onChange,
}: {
    active: CardTab;
    onChange: (tab: CardTab) => void;
}) {
    return (
        <div
            role="tablist"
            aria-label="Kata sections"
            className="px-6 border-b border-base-300 flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {TABS.map((tab) => {
                const isActive = active === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`tab-${tab.id}`}
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        className={`px-3 py-4 text-sm transition-colors border-b-2 -mb-px shrink-0 flex items-center gap-2 ${
                            isActive
                                ? 'border-primary text-base-content font-medium'
                                : 'border-transparent text-base-content/60 hover:text-base-content'
                        }`}
                        onClick={() => onChange(tab.id)}
                    >
                        <FontAwesomeIcon
                            icon={tab.icon}
                            aria-hidden="true"
                            className={isActive ? 'text-primary' : ''}
                        />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
