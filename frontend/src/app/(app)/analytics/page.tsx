'use client';

import { useState } from 'react';
import { useBoards } from '@/hooks/use-boards';
import { useBurndown, useVelocity, useCycleTime } from '@/hooks/use-analytics';
import { BurndownChart } from '@/components/analytics/BurndownChart';
import { VelocityChart } from '@/components/analytics/VelocityChart';
import { CycleTimeChart } from '@/components/analytics/CycleTimeChart';
import { Field, Select } from '@/components/ui';

// Tiny inline state used inside each chart card. Replaces the previous
// pattern of `{data && <Chart />}` which silently rendered nothing on error
// and gave loading no surface area.
function ChartState({
    isLoading,
    error,
    onRetry,
}: {
    isLoading: boolean;
    error: Error | null;
    onRetry: () => void;
}) {
    if (isLoading) {
        return (
            <p
                role="status"
                aria-live="polite"
                className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
            >
                Plotting…
            </p>
        );
    }
    if (error) {
        return (
            <div role="alert">
                <p className="text-sm text-base-content/70">
                    {error.message || 'The model went quiet on this one.'}
                </p>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm mt-3"
                    onClick={onRetry}
                >
                    Try again
                </button>
            </div>
        );
    }
    return null;
}

export default function AnalyticsPage() {
    const { data: boards } = useBoards();
    const [selectedBoard, setSelectedBoard] = useState<string>('');

    const burndown = useBurndown(selectedBoard);
    const velocity = useVelocity(selectedBoard);
    const cycleTime = useCycleTime(selectedBoard);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-16">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Analytics
                </p>
                <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                    Numbers that{' '}
                    <span className="italic text-primary">don&rsquo;t lie.</span>
                </h1>
                <p className="mt-4 text-base text-base-content/60 max-w-xl">
                    Burndown when it matters, velocity when it does. No dashboards for the
                    sake of dashboards.
                </p>
            </div>

            {/* Board selector */}
            <div className="mb-12 max-w-md">
                <Field label="Choose a dojo" htmlFor="analytics-board">
                    <Select
                        id="analytics-board"
                        value={selectedBoard}
                        onChange={(e) => setSelectedBoard(e.target.value)}
                    >
                        <option value="">— Pick one —</option>
                        {boards?.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.title}
                            </option>
                        ))}
                    </Select>
                </Field>
            </div>

            <section aria-label="Charts">
                {/* Empty state — no board selected yet */}
                {!selectedBoard && (
                    <div className="bg-base-100 rounded-lg shadow-e1 p-12 max-w-2xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                            Waiting
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            Pick a dojo <span className="italic text-primary">to begin.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            Every chart here reads from one board at a time.
                        </p>
                    </div>
                )}

                {/* Charts */}
                {selectedBoard && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                01 — Burndown
                            </p>
                            <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                How much is left.
                            </h2>
                            <div className="mt-6 min-h-[240px]">
                                {burndown.data ? (
                                    <BurndownChart data={burndown.data} />
                                ) : (
                                    <ChartState
                                        isLoading={burndown.isLoading}
                                        error={burndown.error}
                                        onRetry={() => burndown.refetch()}
                                    />
                                )}
                            </div>
                        </article>

                        <article className="bg-base-100 rounded-lg shadow-e1 p-8">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                02 — Velocity
                            </p>
                            <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Twelve weeks of finish.
                            </h2>
                            <div className="mt-6 min-h-[240px]">
                                {velocity.data ? (
                                    <VelocityChart data={velocity.data} />
                                ) : (
                                    <ChartState
                                        isLoading={velocity.isLoading}
                                        error={velocity.error}
                                        onRetry={() => velocity.refetch()}
                                    />
                                )}
                            </div>
                        </article>

                        <article className="bg-base-100 rounded-lg shadow-e1 p-8 lg:col-span-2">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                03 — Cycle time
                            </p>
                            <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                                Where the work actually slows.
                            </h2>
                            {cycleTime.data ? (
                                <div className="mt-8">
                                    <div className="flex items-baseline gap-8 mb-8 pb-6 border-b border-base-300">
                                        <div>
                                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                                Average
                                            </p>
                                            <p className="mt-2 font-display text-4xl font-medium tracking-tight">
                                                {Math.round(cycleTime.data.average * 10) / 10}
                                                <span className="text-base text-base-content/60 ml-2">
                                                    days
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                                Completed
                                            </p>
                                            <p className="mt-2 font-display text-4xl font-medium tracking-tight">
                                                {cycleTime.data.total}
                                                <span className="text-base text-base-content/60 ml-2">
                                                    cards
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    {cycleTime.data.byPriority.length > 0 ? (
                                        <CycleTimeChart data={cycleTime.data.byPriority} />
                                    ) : (
                                        <p className="text-sm text-base-content/70">
                                            Not enough completed cards yet to break down by priority.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-6 min-h-[120px]">
                                    <ChartState
                                        isLoading={cycleTime.isLoading}
                                        error={cycleTime.error}
                                        onRetry={() => cycleTime.refetch()}
                                    />
                                </div>
                            )}
                        </article>
                    </div>
                )}
            </section>
        </div>
    );
}
