import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — API',
    description: 'A public API is coming. Not yet.',
};

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
