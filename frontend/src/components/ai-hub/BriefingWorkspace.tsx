'use client';

import { useState } from 'react';
import { useAIBriefing } from '@/hooks/use-ai';
import { usePinnedHighlights } from '@/hooks/use-pinned-highlights';
import { useToast } from '@/providers/ToastProvider';
import { BriefingResultView } from './BriefingResultView';
import { WorkspaceShell, WorkspaceError, WorkspaceFooter } from './WorkspaceShell';

interface BriefingResult {
    briefing: string;
    highlights: string[];
    recommendations: string[];
    stats: { total: number; completed: number; overdue: number };
}

export function BriefingWorkspace() {
    const briefing = useAIBriefing();
    const { pin, isPinned, pins, max } = usePinnedHighlights();
    const toast = useToast();
    const [result, setResult] = useState<BriefingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRun = async () => {
        setError(null);
        try {
            const data = await briefing.mutateAsync({ type: 'daily' });
            setResult(data as BriefingResult);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'The model went quiet. Try again.',
            );
        }
    };

    const handlePin = (text: string) => {
        if (pins.length >= max && !isPinned(text)) {
            toast.info(`Dashboard holds ${max} pins. Unpin one first.`);
            return;
        }
        if (isPinned(text)) {
            toast.info('Already pinned.');
            return;
        }
        pin(text);
        toast.success('Pinned to dashboard.');
    };

    return (
        <WorkspaceShell
            number="01"
            label="Daily briefing"
            body="Two paragraphs about what you are walking into today."
        >
            {!result && !error && (
                <WorkspaceFooter>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleRun}
                        disabled={briefing.isPending}
                    >
                        {briefing.isPending ? 'Reading the room…' : 'Read the room'}
                    </button>
                </WorkspaceFooter>
            )}

            {error && <WorkspaceError message={error} />}

            {result && !error && (
                <div className="mt-10 border-t border-base-300 pt-10">
                    <BriefingResultView
                        data={result}
                        onPin={handlePin}
                        isPinned={isPinned}
                    />
                    <WorkspaceFooter>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => setResult(null)}
                        >
                            Run again
                        </button>
                    </WorkspaceFooter>
                </div>
            )}
        </WorkspaceShell>
    );
}
