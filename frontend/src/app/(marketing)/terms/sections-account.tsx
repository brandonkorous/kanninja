import Link from 'next/link';
import type { LegalSectionData } from '@/components/marketing/LegalLayout';

// Sections 01–06 of /terms. Account, subscription, content. Companion file
// sections-conduct.tsx covers 07–12 (acceptable use through governing law).

export const termsAccountSections: LegalSectionData[] = [
    {
        id: 'acceptance',
        number: '01',
        title: 'Acceptance of these terms',
        body: (
            <>
                <p>
                    These Terms of Service are a contract between you and{' '}
                    <strong>Brandon Korous</strong>, a sole proprietor based in
                    California doing business as kanNINJA ("kanNINJA," "we," "us"
                    or "our"). They cover your use of the kanNINJA web app,
                    marketing pages, APIs, and any related services.
                </p>
                <p>
                    By creating an account or using the service, you agree to
                    these Terms, our{' '}
                    <Link href="/privacy">Privacy Policy</Link>, our{' '}
                    <Link href="/aup">Acceptable Use Policy</Link>, and (if you
                    are on a paid plan) our{' '}
                    <Link href="/refund">Refund Policy</Link>. If you do not
                    agree, do not use the service.
                </p>
                <p>
                    If you are using kanNINJA on behalf of a company or other
                    organization, you represent that you are authorized to bind
                    that organization to these Terms.
                </p>
            </>
        ),
    },
    {
        id: 'account',
        number: '02',
        title: 'Your account',
        body: (
            <>
                <p>
                    You need an account to use most of the service. Authentication
                    is handled by Clerk; the basics still apply:
                </p>
                <ul>
                    <li>
                        You must be at least 13 years old. If you are under 18,
                        you must have a parent or guardian's permission.
                    </li>
                    <li>
                        Provide accurate registration information and keep it up
                        to date.
                    </li>
                    <li>
                        Keep your credentials secure. You are responsible for
                        activity under your account.
                    </li>
                    <li>
                        One person, one account. Sharing a single account across
                        multiple people is not permitted on paid plans — invite
                        them as workspace members instead.
                    </li>
                    <li>
                        Tell us promptly at{' '}
                        <a href="mailto:security@kanninja.com">
                            security@kanninja.com
                        </a>{' '}
                        if you suspect your account has been compromised.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'subscriptions',
        number: '03',
        title: 'Subscriptions, billing, and taxes',
        body: (
            <>
                <h3>Plans and pricing</h3>
                <p>
                    kanNINJA offers a free plan and several paid tiers. Pricing,
                    features, and limits are described on the{' '}
                    <Link href="/pricing">Pricing</Link> page and may change with
                    notice.
                </p>
                <h3>Billing</h3>
                <p>
                    Paid plans are billed in advance through Stripe on a monthly
                    or annual cycle, depending on what you choose. Subscriptions
                    auto-renew at the end of each cycle until you cancel. By
                    subscribing you authorize Stripe to charge your payment
                    method on each renewal.
                </p>
                <h3>Cancellation</h3>
                <p>
                    You can cancel at any time from your account settings.
                    Cancellation takes effect at the end of the current billing
                    period; you keep paid features until then.
                </p>
                <h3>Refunds</h3>
                <p>
                    We do not offer refunds for partial periods or unused time.
                    See the <Link href="/refund">Refund Policy</Link> for the
                    short list of exceptions (duplicate charges, charges after a
                    cancellation we missed).
                </p>
                <h3>Taxes</h3>
                <p>
                    Prices listed are exclusive of taxes unless stated otherwise.
                    You are responsible for any sales, use, VAT, GST, or similar
                    taxes that apply to your purchase. Where required, we
                    collect them on top of the listed price.
                </p>
                <h3>Price changes</h3>
                <p>
                    We may change prices for new billing cycles with at least 30
                    days' notice by email. The price you are paying when notice
                    is given remains in effect until your next renewal.
                </p>
            </>
        ),
    },
    {
        id: 'free-plan',
        number: '04',
        title: 'Free plan',
        body: (
            <>
                <p>
                    The free plan is offered to let you try kanNINJA without
                    commitment. Limits are listed on the{' '}
                    <Link href="/pricing">Pricing</Link> page. We may change the
                    limits or discontinue the free plan with reasonable notice.
                    We will not delete free-plan content without first warning
                    you.
                </p>
            </>
        ),
    },
    {
        id: 'your-content',
        number: '05',
        title: 'Your content',
        body: (
            <>
                <p>
                    Boards, lists, cards, comments, attachments, custom fields,
                    and anything else you put into kanNINJA is "Your Content."
                </p>
                <p>
                    <strong>You own Your Content.</strong> We do not claim any
                    ownership of it.
                </p>
                <p>
                    You grant kanNINJA a limited, worldwide, royalty-free
                    license to host, copy, display, transmit, and process Your
                    Content for the sole purpose of operating the service for
                    you and the people you share it with. The license ends when
                    you delete the content or close your account, except to the
                    extent retained in backups (see the{' '}
                    <Link href="/privacy#retention">Privacy Policy</Link>) or
                    required by law.
                </p>
                <p>
                    You are responsible for Your Content and for having the
                    right to use any third-party material included in it.
                </p>
            </>
        ),
    },
    {
        id: 'our-ip',
        number: '06',
        title: 'Our intellectual property',
        body: (
            <>
                <p>
                    The kanNINJA software, brand, logos, designs, documentation,
                    and content we author belong to Brandon Korous / kanNINJA
                    and are protected by copyright, trademark, and other laws.
                    These Terms grant you a limited right to use the service
                    according to your plan; they do not transfer any of the
                    foregoing.
                </p>
                <p>
                    The kanNINJA source code may be published under a separate
                    source-available license{' '}
                    (<a href="https://fsl.software/" rel="noopener noreferrer">
                        FSL-1.1-Apache-2.0
                    </a>
                    ). That license governs use of the code itself; these Terms
                    govern your use of the hosted service at kanninja.com.
                </p>
            </>
        ),
    },
];
