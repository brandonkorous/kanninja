'use client';

import { useState } from 'react';
import {
    faChartLine,
    faWandMagicSparkles,
    faBullseye,
    faComments,
} from '@fortawesome/free-solid-svg-icons';
import { AIToolRail, type AITool } from '@/components/ai-hub/AIToolRail';
import { BriefingWorkspace } from '@/components/ai-hub/BriefingWorkspace';
import { ParseTaskWorkspace } from '@/components/ai-hub/ParseTaskWorkspace';
import { DecomposeGoalWorkspace } from '@/components/ai-hub/DecomposeGoalWorkspace';
import { MeetingWorkspace } from '@/components/ai-hub/MeetingWorkspace';

type Tool = 'briefing' | 'parse' | 'decompose' | 'meeting';

const TOOLS: AITool[] = [
    {
        id: 'briefing',
        number: '01',
        icon: faChartLine,
        label: 'Daily briefing',
        body: 'Two paragraphs about what you are walking into today.',
        placeholder: null,
    },
    {
        id: 'parse',
        number: '02',
        icon: faWandMagicSparkles,
        label: 'Parse a task',
        body: 'Type a paragraph; get a kata you can drop on a board.',
        placeholder: 'Need to review PR #123 by Friday, high priority',
    },
    {
        id: 'decompose',
        number: '03',
        icon: faBullseye,
        label: 'Decompose a goal',
        body: 'Break a big thing into small things you will actually finish.',
        placeholder: 'Launch the Hanko design system to the v2 marketing site by end of month',
    },
    {
        id: 'meeting',
        number: '04',
        icon: faComments,
        label: 'Pull tasks from notes',
        body: 'Paste meeting notes; get the action items, on a board.',
        placeholder: 'Paste meeting notes here…',
    },
];

export default function AIHubPage() {
    const [tool, setTool] = useState<Tool>('briefing');

    return (
        <div className="max-w-7xl mx-auto">
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

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
                <AIToolRail
                    tools={TOOLS}
                    active={tool}
                    onChange={(id) => setTool(id as Tool)}
                />

                {tool === 'briefing' && <BriefingWorkspace />}
                {tool === 'parse' && <ParseTaskWorkspace />}
                {tool === 'decompose' && <DecomposeGoalWorkspace />}
                {tool === 'meeting' && <MeetingWorkspace />}
            </div>
        </div>
    );
}
