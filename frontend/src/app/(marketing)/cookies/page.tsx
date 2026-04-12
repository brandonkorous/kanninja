import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Cookies',
    description: 'Cookie policy. Being written.',
};

export default function CookiesPage() {
    return (
        <ComingSoonPage
            eyebrow="Cookies"
            headlineBefore="Being"
            headlineItalic="written."
            body="Short version: we use a session cookie to keep you signed in and nothing else. No tracking pixels, no third-party ad cookies. The long version is on the way."
        />
    );
}
