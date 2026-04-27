'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons';

interface BriefingData {
    briefing: string;
    highlights: string[];
    recommendations: string[];
    stats: { total: number; completed: number; overdue: number };
}

export function BriefingResultView({
    data,
    onPin,
    isPinned,
}: {
    data: BriefingData;
    onPin: (text: string) => void;
    isPinned: (text: string) => boolean;
}) {
    return (
        <div className="space-y-12">
            {/* Stats — three mono numbers */}
            <div className="grid grid-cols-3 gap-6">
                <Stat label="Total kata" value={data.stats.total} />
                <Stat label="Done" value={data.stats.completed} />
                <Stat
                    label="Overdue"
                    value={data.stats.overdue}
                    tone={data.stats.overdue > 0 ? 'warn' : 'normal'}
                />
            </div>

            <div>
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                    Walking into today
                </p>
                <p className="mt-4 font-display text-xl leading-relaxed text-base-content/90">
                    {data.briefing}
                </p>
            </div>

            {data.highlights.length > 0 && (
                <HighlightList items={data.highlights} onPin={onPin} isPinned={isPinned} />
            )}

            {data.recommendations.length > 0 && (
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Recommendations
                    </p>
                    <ul className="mt-6 space-y-4">
                        {data.recommendations.map((r, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-4 border-l-2 border-primary pl-4"
                            >
                                <span className="font-mono text-xs text-primary mt-1 tabular-nums">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <p className="flex-1 text-base text-base-content/80 leading-relaxed">
                                    {r}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Stat({
    label,
    value,
    tone = 'normal',
}: {
    label: string;
    value: number;
    tone?: 'normal' | 'warn';
}) {
    const numColor = tone === 'warn' && value > 0 ? 'text-primary' : 'text-base-content';
    return (
        <div>
            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                {label}
            </p>
            <p
                className={`mt-3 font-mono text-4xl font-medium tracking-tight tabular-nums ${numColor}`}
            >
                {value}
            </p>
        </div>
    );
}

function HighlightList({
    items,
    onPin,
    isPinned,
}: {
    items: string[];
    onPin: (text: string) => void;
    isPinned: (text: string) => boolean;
}) {
    return (
        <div>
            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                Highlights
            </p>
            <ul className="mt-6 space-y-4">
                {items.map((item, i) => {
                    const pinned = isPinned(item);
                    return (
                        <li key={i} className="flex items-start gap-4 group">
                            <span className="font-mono text-xs text-base-content/30 mt-1 tabular-nums">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <p className="flex-1 text-base text-base-content/80 leading-relaxed">
                                {item}
                            </p>
                            <button
                                type="button"
                                onClick={() => onPin(item)}
                                aria-label={pinned ? 'Already pinned' : 'Pin to dashboard'}
                                aria-pressed={pinned}
                                disabled={pinned}
                                className={`text-xs font-mono uppercase tracking-widest rounded px-2 py-1 transition-colors focus-visible:shadow-focus ${
                                    pinned
                                        ? 'text-primary'
                                        : 'text-base-content/40 hover:text-primary opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                                }`}
                            >
                                <FontAwesomeIcon
                                    icon={faThumbtack}
                                    aria-hidden="true"
                                    className="mr-1"
                                />
                                {pinned ? 'Pinned' : 'Pin'}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
