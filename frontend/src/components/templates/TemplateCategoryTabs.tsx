'use client';

import {
    TEMPLATE_CATEGORY_LABEL,
    TEMPLATE_CATEGORY_ORDER,
    type TemplateCategory,
} from '@kanninja/shared';

export type TemplateFilter = 'all' | TemplateCategory;

interface Props {
    value: TemplateFilter;
    onChange: (next: TemplateFilter) => void;
    /** Categories that actually have at least one template loaded. */
    available: ReadonlySet<TemplateCategory>;
}

// Tab strip for filtering the templates grid. Hides empty categories so the
// strip never lies about what's behind it. "All" is always present.
export function TemplateCategoryTabs({ value, onChange, available }: Props) {
    const visibleCategories = TEMPLATE_CATEGORY_ORDER.filter((c) =>
        available.has(c),
    );

    const tabs: { key: TemplateFilter; label: string }[] = [
        { key: 'all', label: 'All' },
        ...visibleCategories.map((c) => ({
            key: c as TemplateFilter,
            label: TEMPLATE_CATEGORY_LABEL[c],
        })),
    ];

    return (
        <div
            role="tablist"
            aria-label="Template categories"
            className="mb-12 flex flex-wrap gap-2 border-b border-base-300 pb-4"
        >
            {tabs.map((tab) => {
                const active = tab.key === value;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(tab.key)}
                        className={[
                            'text-eyebrow font-mono uppercase tracking-widest px-4 py-2 rounded-md transition-colors',
                            active
                                ? 'bg-primary text-primary-content'
                                : 'text-base-content/60 hover:text-base-content hover:bg-base-200',
                        ].join(' ')}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
