import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Terms',
    description: 'Terms of service. Being written.',
};

export default function TermsPage() {
    return (
        <ComingSoonPage
            eyebrow="Terms"
            headlineBefore="Being"
            headlineItalic="written."
            body="The terms of service are in drafting. Plain English, no surprises, no waiver clauses tucked in the middle. Email us if you need the long version now."
        />
    );
}
