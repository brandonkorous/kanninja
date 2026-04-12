'use client';

import {
    useTimeEntries,
    useStartTimer,
    useStopTimer,
} from '@/hooks/use-card-features';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export function TimeTab({ boardId, cardId }: { boardId: string; cardId: string }) {
    const { data: entries } = useTimeEntries(boardId, cardId);
    const start = useStartTimer(boardId, cardId);
    const stop = useStopTimer(boardId, cardId);

    const running = entries?.find((e) => e.isRunning);
    const total = entries?.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0) ?? 0;

    return (
        <div className="space-y-6">
            {/* Total tracked + timer control */}
            <div className="bg-base-200 rounded-lg p-6 border border-base-300 flex items-center justify-between gap-4">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                        Total tracked
                    </p>
                    <p className="mt-2 font-display text-3xl font-medium tracking-tight">
                        {formatDuration(total)}
                    </p>
                </div>
                {running ? (
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => stop.mutate()}
                        disabled={stop.isPending}
                    >
                        <FontAwesomeIcon icon={faStop} aria-hidden="true" className="mr-2" />
                        Stop
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn btn-outline btn-secondary"
                        onClick={() => start.mutate(undefined)}
                        disabled={start.isPending}
                    >
                        <FontAwesomeIcon icon={faPlay} aria-hidden="true" className="mr-2" />
                        Start
                    </button>
                )}
            </div>

            {/* History */}
            <div>
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-4">
                    Sessions
                </p>
                {entries?.length === 0 && (
                    <p className="text-sm text-base-content/50">
                        Nothing tracked yet. Start the timer when you begin.
                    </p>
                )}
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {entries?.map((e) => (
                        <li
                            key={e.id}
                            className="flex items-baseline justify-between border-b border-base-300 pb-2 text-sm"
                        >
                            <span className="text-base-content/70">
                                {new Date(e.startedAt).toLocaleString()}
                            </span>
                            <span
                                className={`font-mono ${
                                    e.isRunning ? 'text-primary' : 'text-base-content'
                                }`}
                            >
                                {e.isRunning ? 'Running…' : formatDuration(e.durationSeconds ?? 0)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
