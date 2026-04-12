import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Privacy',
    description: 'Privacy policy. Being written.',
};

export default function PrivacyPage() {
    return (
        <ComingSoonPage
            eyebrow="Privacy"
            headlineBefore="Being"
            headlineItalic="written."
            body="We're drafting the privacy policy with a lawyer who reads what they write. Until it is ready, the short version: we don't sell your data and we don't train on it. Email us if you need the long version now."
        />
    );
}
