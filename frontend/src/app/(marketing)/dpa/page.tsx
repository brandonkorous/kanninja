import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Data Processing Agreement',
    description: 'DPA for business customers. Being written.',
};

export default function DPAPage() {
    return (
        <ComingSoonPage
            eyebrow="Data processing"
            headlineBefore="Being"
            headlineItalic="written."
            body="A standard DPA for business and enterprise customers is in drafting. If you need one today to close a contract, email us and we will send the draft."
        />
    );
}
