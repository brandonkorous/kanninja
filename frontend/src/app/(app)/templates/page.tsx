'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { AITemplateModal } from '@/components/templates/AITemplateModal';

interface Template {
    id: string;
    name: string;
    description: string;
    lists: string[];
}

type ApplyInput = {
    title: string;
    description?: string;
    lists: {
        title: string;
        cards: {
            title: string;
            description?: string;
            priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
        }[];
    }[];
};

export default function TemplatesPage() {
    const api = useApi();
    const router = useRouter();
    const toast = useToast();
    const [showAI, setShowAI] = useState(false);

    const {
        data: templates,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['templates'],
        queryFn: () =>
            api.get<{ data: Template[] }>('/api/v1/templates/boards').then((r) => r.data),
    });

    const applyTemplate = useMutation({
        mutationFn: (input: ApplyInput) =>
            api
                .post<{ data: { id: string } }>('/api/v1/templates/boards/apply', input)
                .then((r) => r.data),
        onSuccess: (board) => {
            toast.success('Dojo opened.');
            router.push(`/dojo/${board.id}`);
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });

    const handleApplyBuiltIn = (tpl: Template) => {
        applyTemplate.mutate({
            title: tpl.name,
            description: tpl.description,
            lists: tpl.lists.map((title) => ({ title, cards: [] })),
        });
    };

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
                        <span className="italic text-primary">already shaped.</span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60 max-w-xl">
                        Pick a built-in template, or have the model draft one from a description.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    aria-haspopup="dialog"
                    onClick={() => setShowAI(true)}
                >
                    <FontAwesomeIcon
                        icon={faWandMagicSparkles}
                        aria-hidden="true"
                        className="mr-2"
                    />
                    Draft with AI
                </button>
            </div>

            <section aria-label="Templates">
                {/* Loading */}
                {isLoading && (
                    <p
                        role="status"
                        aria-live="polite"
                        className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                    >
                        Loading templates…
                    </p>
                )}

                {/* Error — announced to assistive tech + retry */}
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
                            <span className="italic text-primary">templates.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            The backend didn&rsquo;t answer. Try again in a moment.
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

                {/* Grid */}
                {templates && templates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((tpl) => (
                            <TemplateCard
                                key={tpl.id}
                                name={tpl.name}
                                description={tpl.description}
                                lists={tpl.lists}
                                disabled={applyTemplate.isPending}
                                onUse={() => handleApplyBuiltIn(tpl)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <AITemplateModal
                open={showAI}
                isApplying={applyTemplate.isPending}
                onClose={() => setShowAI(false)}
                onGenerated={(result) => {
                    applyTemplate.mutate({
                        title: result.board_title,
                        description: result.board_description,
                        lists: result.lists.map((l) => ({
                            title: l.title,
                            cards: l.cards.map((c) => ({
                                title: c.title,
                                description: c.description,
                                priority:
                                    (c.priority as 'none' | 'low' | 'medium' | 'high' | 'urgent') ??
                                    'none',
                            })),
                        })),
                    });
                    setShowAI(false);
                }}
            />
        </div>
    );
}
