import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Careers',
    description: 'We are not hiring yet. When we are, it will be here.',
};

export default function CareersPage() {
    return (
        <ComingSoonPage
            eyebrow="Careers"
            headlineBefore="We are not"
            headlineItalic="hiring yet."
            body="kanNINJA is a small team. When we open a role, it will show up here with the work described plainly. No ping-pong tables on the list."
        />
    );
}
