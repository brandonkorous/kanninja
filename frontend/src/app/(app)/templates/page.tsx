'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { BoardTemplate, TemplateCategory } from '@kanninja/shared';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { TemplateCard } from '@/components/templates/TemplateCard';
import {
    TemplateCategoryTabs,
    type TemplateFilter,
} from '@/components/templates/TemplateCategoryTabs';

const PRIORITIES = ['none', 'low', 'medium', 'high', 'urgent'] as const;
type Priority = (typeof PRIORITIES)[number];

// Defensive: the apply endpoint validates against a strict lowercase enum.
// Unknown values fall back to 'none' rather than failing the whole import.
function normalizePriority(raw: string | null | undefined): Priority {
    const lower = (raw ?? '').toLowerCase();
    return (PRIORITIES as readonly string[]).includes(lower)
        ? (lower as Priority)
        : 'none';
}

type ApplyInput = {
    title: string;
    description?: string;
    lists: {
        title: string;
        cards: {
            title: string;
            description?: string;
            priority?: Priority;
            checklist?: string[];
        }[];
    }[];
};

// A brand-new board can't have anything "In Progress" or "Done" — work
// hasn't started yet. Pool every seed card into the first list so the
// template's authored layout (used for marketing previews) doesn't bleed
// into the user's lived experience on day one.
function buildApplyInput(tpl: BoardTemplate): ApplyInput {
    const allCards = tpl.lists.flatMap((l) =>
        l.cards.map((c) => ({
            title: c.title,
            description: c.description,
            priority: normalizePriority(c.priority),
            checklist: c.checklist?.filter(
                (s) => typeof s === 'string' && s.trim().length > 0,
            ),
        })),
    );
    return {
        title: tpl.name,
        description: tpl.description,
        lists: tpl.lists.map((l, i) => ({
            title: l.title,
            cards: i === 0 ? allCards : [],
        })),
    };
}

export default function TemplatesPage() {
    const api = useApi();
    const router = useRouter();
    const toast = useToast();
    const [filter, setFilter] = useState<TemplateFilter>('all');

    const {
        data: templates,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['templates'],
        queryFn: () =>
            api
                .get<{ data: BoardTemplate[] }>('/api/v1/templates/boards')
                .then((r) => r.data),
    });

    const applyTemplate = useMutation({
        mutationFn: (input: ApplyInput) =>
            api
                .post<{ data: { id: string } }>(
                    '/api/v1/templates/boards/apply',
                    input,
                )
                .then((r) => r.data),
        onSuccess: (board) => {
            toast.success('Dojo opened.');
            router.push(`/dojo/${board.id}`);
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });

    const availableCategories = useMemo<ReadonlySet<TemplateCategory>>(
        () => new Set((templates ?? []).map((t) => t.category)),
        [templates],
    );

    const visibleTemplates = useMemo(() => {
        if (!templates) return [];
        if (filter === 'all') return templates;
        return templates.filter((t) => t.category === filter);
    }, [templates, filter]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Templates
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Start from something{' '}
                        <span className="italic text-primary">
                            already shaped.
                        </span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60 max-w-xl">
                        Pick one, and it lands on a fresh dojo with the columns
                        and starter kata already in place.
                    </p>
                </div>
            </div>

            <section aria-label="Templates">
                {isLoading && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                    >
                        Loading templates…
                    </p>
                )}

                {error && (
                    <div
                        role="alert"
                        className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl"
                    >
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                            Something on our end
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            We couldn&rsquo;t load the{' '}
                            <span className="italic text-primary">
                                templates.
                            </span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            The backend didn&rsquo;t answer. Try again in a
                            moment.
                        </p>
                        <button
                            type="button"
                            className="btn btn-secondary mt-6"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            {isFetching ? 'Trying…' : 'Try again'}
                        </button>
                    </div>
                )}

                {templates && templates.length > 0 && (
                    <>
                        <TemplateCategoryTabs
                            value={filter}
                            onChange={setFilter}
                            available={availableCategories}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {visibleTemplates.map((tpl) => (
                                <TemplateCard
                                    key={tpl.id}
                                    name={tpl.name}
                                    description={tpl.description}
                                    lists={tpl.lists.map((l) => l.title)}
                                    disabled={applyTemplate.isPending}
                                    onUse={() =>
                                        applyTemplate.mutate(buildApplyInput(tpl))
                                    }
                                />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
