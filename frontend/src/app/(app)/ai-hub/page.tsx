'use client';

import { useState } from 'react';
import {
    useParseTask,
    useDecomposeGoal,
    useAIBriefing,
    useAnalyzeMeeting,
} from '@/hooks/use-ai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faWandMagicSparkles,
    faBullseye,
    faChartLine,
    faComments,
    faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { AIToolRail, type AITool } from '@/components/ai-hub/AIToolRail';
import { Field, Textarea } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';

type Tool = 'parse' | 'decompose' | 'briefing' | 'meeting';

const TOOLS: AITool[] = [
    {
        id: 'parse',
        number: '01',
        icon: faWandMagicSparkles,
        label: 'Parse a task',
        body: 'Type a paragraph; get a structured card.',
        placeholder: 'Need to review PR #123 by Friday, high priority, assign to Alex',
    },
    {
        id: 'decompose',
        number: '02',
        icon: faBullseye,
        label: 'Decompose a goal',
        body: 'Break a big thing into small things you will actually finish.',
        placeholder: 'Launch the Hanko design system to the v2 marketing site by end of month',
    },
    {
        id: 'briefing',
        number: '03',
        icon: faChartLine,
        label: 'Daily briefing',
        body: 'Two paragraphs about what you are walking into today.',
        placeholder: null,
    },
    {
        id: 'meeting',
        number: '04',
        icon: faComments,
        label: 'Pull tasks from notes',
        body: 'Paste meeting notes; get the action items.',
        placeholder: 'Paste meeting notes here…',
    },
];

export default function AIHubPage() {
    const [tool, setTool] = useState<Tool>('parse');
    const [input, setInput] = useState('');
    const [result, setResult] = useState<unknown>(null);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const parseTask = useParseTask();
    const decomposeGoal = useDecomposeGoal();
    const briefing = useAIBriefing();
    const meeting = useAnalyzeMeeting();

    const isLoading =
        parseTask.isPending ||
        decomposeGoal.isPending ||
        briefing.isPending ||
        meeting.isPending;

    const handleRun = async () => {
        setResult(null);
        setError(null);
        try {
            if (tool === 'parse') setResult(await parseTask.mutateAsync(input));
            else if (tool === 'decompose')
                setResult(await decomposeGoal.mutateAsync({ goal: input }));
            else if (tool === 'briefing')
                setResult(await briefing.mutateAsync({ type: 'daily' }));
            else if (tool === 'meeting')
                setResult(await meeting.mutateAsync({ transcript: input }));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'The model went quiet. Try again in a moment.',
            );
        }
    };

    const handleCopyResult = async () => {
        if (result === null) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            toast.success('Suggestion copied.');
        } catch {
            toast.error('Could not copy to clipboard.');
        }
    };

    const current = TOOLS.find((t) => t.id === tool)!;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-baseline justify-between mb-16 gap-6 flex-wrap">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        AI Hub · Pro+
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        The second{' '}
                        <span className="italic text-primary">pair of eyes.</span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60 max-w-xl">
                        The model suggests. You decide. In that order.
                    </p>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
                <AIToolRail
                    tools={TOOLS}
                    active={tool}
                    onChange={(id) => {
                        setTool(id as Tool);
                        setInput('');
                        setResult(null);
                        setError(null);
                    }}
                />

                {/* Workspace */}
                <section
                    aria-label="Technique workspace"
                    className="bg-base-100 rounded-lg shadow-e1 p-8"
                >
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        {current.number} — technique
                    </p>
                    <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">
                        {current.label}
                    </h2>
                    <p className="mt-3 text-sm text-base-content/70">{current.body}</p>

                    {current.placeholder !== null && (
                        <div className="mt-8">
                            <Field label="Input" htmlFor="ai-input">
                                <Textarea
                                    id="ai-input"
                                    rows={5}
                                    placeholder={current.placeholder}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </Field>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleRun}
                            disabled={isLoading || (current.placeholder !== null && !input.trim())}
                        >
                            {isLoading ? 'Thinking…' : 'Run the technique'}
                        </button>
                    </div>

                    {/* Error — announced to assistive tech, with retry via the
                      * primary button above. */}
                    {error && (
                        <div
                            role="alert"
                            className="mt-10 border-t border-base-300 pt-8"
                        >
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                                Something on our end
                            </p>
                            <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
                                The model went quiet.
                            </h3>
                            <p className="mt-3 text-sm text-base-content/70">{error}</p>
                        </div>
                    )}

                    {/* Suggestion — JSON for now, copyable. The italic
                      * disclaimer at the bottom is the brand voice on this
                      * page: the model suggests, the user decides. */}
                    {result !== null && !error && (
                        <div className="mt-10 border-t border-base-300 pt-8">
                            <div className="flex items-baseline justify-between gap-4 mb-4">
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                    Suggestion
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={handleCopyResult}
                                >
                                    <FontAwesomeIcon
                                        icon={faCopy}
                                        aria-hidden="true"
                                        className="mr-2"
                                    />
                                    Copy
                                </button>
                            </div>
                            <pre className="bg-base-200 border border-base-300 rounded-md p-4 text-xs text-base-content/80 font-mono overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                            <p className="mt-4 text-xs text-base-content/60 italic">
                                The model suggests. You decide.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
