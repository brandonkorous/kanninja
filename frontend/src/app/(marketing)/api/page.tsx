import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'API',
    description: 'A public REST API for kanNINJA. Not yet — for now, the MCP server covers most agentic use cases.',
    path: '/api',
    ogTitle: 'The public API — coming.',
    ogEyebrow: 'kanNINJA · API',
});

export default function APIPage() {
    return (
        <ComingSoonPage
            eyebrow="API"
            headlineBefore="The public API is"
            headlineItalic="coming."
            body="We have an internal one that the app uses. Opening it up for integrations is real work and it is not the next thing on the list. If you need it sooner, write in."
        />
    );
}
