import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Acceptable Use Policy',
    description:
        'What you can and cannot do with kanNINJA. The short list of things that get accounts suspended.',
    path: '/aup',
    ogTitle: 'Acceptable Use Policy',
    ogEyebrow: 'kanNINJA · AUP',
});

export default function AcceptableUsePage() {
    return (
        <LegalLayout
            eyebrow="Acceptable use"
            headlineBefore="Don't be"
            headlineItalic="that person."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="abuse@kanninja.com"
            intro={
                <p>
                    This is the short list of things that will get an
                    account suspended. It applies to everyone using
                    kanNINJA — free or paid, team or solo — and it
                    extends our{' '}
                    <Link href="/terms">Terms of Service</Link>.
                </p>
            }
            sections={[
                {
                    id: 'spirit',
                    number: '01',
                    title: 'The spirit',
                    body: (
                        <>
                            <p>
                                Use kanNINJA to do work you would be
                                comfortable explaining out loud. Don't use
                                it to harm other people, break the law,
                                damage shared infrastructure, or undermine
                                the service for everyone else.
                            </p>
                            <p>
                                Where we have to make a judgment call, we
                                err toward keeping the platform safe for
                                small teams trying to get things done.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'content',
                    number: '02',
                    title: 'Prohibited content',
                    body: (
                        <>
                            <p>You may not use kanNINJA to host or share:</p>
                            <ul>
                                <li>
                                    Child sexual abuse material (CSAM) or
                                    any content that sexualizes minors. We
                                    report this to the National Center for
                                    Missing & Exploited Children
                                    immediately.
                                </li>
                                <li>
                                    Content that incites violence, terrorism,
                                    or serious harm to specific people or
                                    groups.
                                </li>
                                <li>
                                    Content that doxxes, stalks, or harasses
                                    a specific person.
                                </li>
                                <li>
                                    Content you do not have the right to
                                    share — including pirated software,
                                    leaked credentials, scraped data sold
                                    without consent, and material that
                                    infringes copyright or trademark.
                                </li>
                                <li>
                                    Malware, exploits, ransomware, or
                                    instructions intended to compromise
                                    systems you do not own.
                                </li>
                            </ul>
                        </>
                    ),
                },
                {
                    id: 'conduct',
                    number: '03',
                    title: 'Prohibited conduct',
                    body: (
                        <>
                            <p>You may not:</p>
                            <ul>
                                <li>
                                    Probe, scan, or test the vulnerability
                                    of kanNINJA infrastructure without
                                    written permission. Responsible reports
                                    to{' '}
                                    <a href="mailto:security@kanninja.com">
                                        security@kanninja.com
                                    </a>{' '}
                                    are welcome and not penalized.
                                </li>
                                <li>
                                    Send automated traffic that exceeds
                                    documented rate limits, scrape the
                                    service, or use it as an unauthorized
                                    backend for other applications.
                                </li>
                                <li>
                                    Mine cryptocurrency, run distributed
                                    computing workloads, or otherwise use
                                    kanNINJA's compute or storage as a
                                    free utility.
                                </li>
                                <li>
                                    Send unsolicited email or messages
                                    through kanNINJA's invitation, sharing,
                                    or notification systems.
                                </li>
                                <li>
                                    Impersonate another person, kanNINJA
                                    staff, or any organization, or
                                    misrepresent your affiliation.
                                </li>
                                <li>
                                    Resell or sublicense the service
                                    outside the terms of your plan.
                                </li>
                            </ul>
                        </>
                    ),
                },
                {
                    id: 'ai',
                    number: '04',
                    title: 'Agents and automated access',
                    body: (
                        <>
                            <p>
                                kanNINJA runs no AI of its own. You may
                                connect your own agent over MCP, and
                                everything above applies to what that
                                agent does on your account, plus:
                            </p>
                            <ul>
                                <li>
                                    You are responsible for what your
                                    agent does. Actions it takes with your
                                    credentials are your actions.
                                </li>
                                <li>
                                    Do not use agent access to bulk-extract
                                    boards you do not own, or to scrape the
                                    service beyond the rate limits on your
                                    plan.
                                </li>
                                <li>
                                    Do not use kanNINJA data to train or
                                    fine-tune a model that competes with us.
                                </li>
                                <li>
                                    Keep API keys and agent grants to
                                    yourself. Revoke them on the Agents page
                                    when a client is no longer in use.
                                </li>
                            </ul>
                            <p>
                                Your agent's own provider has usage policies
                                of its own. Those apply on top of this one,
                                and we are not a party to them.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'enforcement',
                    number: '05',
                    title: 'Reporting and enforcement',
                    body: (
                        <>
                            <p>
                                Report violations to{' '}
                                <a href="mailto:abuse@kanninja.com">
                                    abuse@kanninja.com
                                </a>{' '}
                                with as much detail as you can share
                                (URLs, screenshots, timestamps).
                            </p>
                            <p>
                                When we find a violation, we will
                                generally start with a warning and a
                                request to remove the content. For
                                severe or repeat violations — and
                                immediately for CSAM, credible threats,
                                or active malware distribution — we
                                will suspend or terminate the account
                                without notice. We may also report
                                conduct to law enforcement when required
                                or when we believe there is risk of
                                serious harm.
                            </p>
                            <p>
                                If we suspend your account and you
                                believe we got it wrong, email{' '}
                                <a href="mailto:appeals@kanninja.com">
                                    appeals@kanninja.com
                                </a>{' '}
                                with the account email and a short
                                explanation. A human will read it.
                            </p>
                        </>
                    ),
                },
            ]}
        />
    );
}
