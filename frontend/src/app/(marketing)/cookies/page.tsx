import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Cookie Policy',
    description:
        'The cookies kanNINJA uses, what they do, and how to opt out. Short and specific.',
    path: '/cookies',
    ogTitle: 'Cookie Policy',
    ogEyebrow: 'kanNINJA · Cookies',
});

export default function CookiesPage() {
    return (
        <LegalLayout
            eyebrow="Cookies"
            headlineBefore="Short list,"
            headlineItalic="specific reasons."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="privacy@kanninja.com"
            intro={
                <p>
                    We use a small number of cookies and similar technologies.
                    This page lists every category, names the providers, and
                    tells you how to turn off the ones that are optional.
                </p>
            }
            sections={[
                {
                    id: 'what',
                    number: '01',
                    title: 'What cookies are',
                    body: (
                        <>
                            <p>
                                Cookies are small text files that a website
                                stores in your browser. We also use{' '}
                                <em>local storage</em> and{' '}
                                <em>session storage</em>, which behave the same
                                way for the purposes of this policy. Throughout
                                this page, "cookies" means all three.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'categories',
                    number: '02',
                    title: 'Categories we use',
                    body: (
                        <>
                            <h3>Strictly necessary</h3>
                            <p>
                                Required for the service to work. They keep
                                you signed in, remember your theme and basic
                                preferences, and help us prevent abuse. You
                                cannot turn these off and continue to use the
                                service.
                            </p>
                            <ul>
                                <li>
                                    <strong>kanNINJA session</strong> — the
                                    cookie that keeps you signed in, plus its
                                    CSRF protection.
                                </li>
                                <li>
                                    <strong>kanNINJA</strong> — theme
                                    (`hanko-theme`), preferences, and CSRF
                                    tokens.
                                </li>
                                <li>
                                    <strong>Stripe</strong> — fraud-prevention
                                    cookies set on billing pages.
                                </li>
                            </ul>
                            <h3>Analytics</h3>
                            <p>
                                Help us understand which features are used and
                                where the product breaks. Aggregated; no
                                personal advertising.
                            </p>
                            <ul>
                                <li>
                                    <strong>Google Analytics 4</strong> — page
                                    views, events, approximate location from
                                    IP. IP anonymization is enabled.
                                </li>
                            </ul>
                            <h3>Session replay</h3>
                            <p>
                                Anonymized session recordings and heatmaps so
                                we can see where the interface confuses
                                people. Form input, passwords, and card
                                content are masked by default.
                            </p>
                            <ul>
                                <li>
                                    <strong>Microsoft Clarity</strong> —
                                    session recording and heatmaps.
                                </li>
                            </ul>
                            <p>
                                We do <strong>not</strong> use advertising
                                cookies, cross-site tracking pixels, or
                                third-party retargeting. We do not sell or
                                share data for cross-context behavioral
                                advertising.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'opt-out',
                    number: '03',
                    title: 'How to opt out',
                    body: (
                        <>
                            <p>
                                You can opt out of analytics and session
                                replay in three ways:
                            </p>
                            <ul>
                                <li>
                                    Use the cookie banner shown on your first
                                    visit. Decline analytics and session
                                    replay there.
                                </li>
                                <li>
                                    Open <strong>Settings → Privacy</strong>{' '}
                                    in the app and toggle them off at any
                                    time.
                                </li>
                                <li>
                                    Email{' '}
                                    <a href="mailto:privacy@kanninja.com">
                                        privacy@kanninja.com
                                    </a>{' '}
                                    and we will process the opt-out manually.
                                </li>
                            </ul>
                            <p>
                                Browser-level controls — Do Not Track,
                                Global Privacy Control, third-party cookie
                                blocking — are honored where they apply.
                                Necessary cookies remain because the service
                                does not function without them.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'related',
                    number: '04',
                    title: 'Related policies and changes',
                    body: (
                        <>
                            <p>
                                For the full picture of what we collect and
                                why, see the{' '}
                                <Link href="/privacy">Privacy Policy</Link>.
                                For the list of providers, see{' '}
                                <Link href="/subprocessors">
                                    Subprocessors
                                </Link>
                                .
                            </p>
                            <p>
                                We will update this page when we add or
                                remove a category. Material changes will be
                                announced in the app at least seven days in
                                advance.
                            </p>
                        </>
                    ),
                },
            ]}
        />
    );
}
