'use client';

import { useState } from 'react';
import { faPlug, faToolbox, faKey } from '@fortawesome/free-solid-svg-icons';
import { AgentRail, type AgentPanel } from '@/components/agents/AgentRail';
import { ConnectPanel } from '@/components/agents/ConnectPanel';
import { ToolCatalogPanel } from '@/components/agents/ToolCatalogPanel';
import { ConnectedPanel } from '@/components/agents/ConnectedPanel';

type Panel = 'connect' | 'tools' | 'connected';

const PANELS: AgentPanel[] = [
    {
        id: 'connect',
        number: '01',
        icon: faPlug,
        label: 'Connect',
        body: 'Point your client at kanNINJA. Roughly two minutes.',
    },
    {
        id: 'tools',
        number: '02',
        icon: faToolbox,
        label: 'Tools',
        body: 'The 42 calls your agent can make on your boards.',
    },
    {
        id: 'connected',
        number: '03',
        icon: faKey,
        label: 'Connected',
        body: 'Who holds a key right now, and how to take it back.',
    },
];

export default function AgentsPage() {
    const [panel, setPanel] = useState<Panel>('connect');

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-baseline justify-between mb-16 gap-6 flex-wrap">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Agents · MCP
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Bring the agent{' '}
                        <span className="italic text-primary">you already pay for.</span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60 max-w-xl">
                        kanNINJA runs no models of its own. Your agent does the thinking;
                        this board holds the work.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
                <AgentRail
                    panels={PANELS}
                    active={panel}
                    onChange={(id) => setPanel(id as Panel)}
                />

                {panel === 'connect' && <ConnectPanel />}
                {panel === 'tools' && <ToolCatalogPanel />}
                {panel === 'connected' && (
                    <ConnectedPanel onConnect={() => setPanel('connect')} />
                )}
            </div>
        </div>
    );
}
