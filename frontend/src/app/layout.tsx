import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { FontAwesomeProvider } from '@/providers/FontAwesomeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { ConsentProvider } from '@/providers/ConsentProvider';
import { CookieBanner } from '@/components/legal/CookieBanner';
import { CookiePreferencesDialog } from '@/components/legal/CookiePreferencesDialog';
import { ClarityScript } from '@/components/legal/ClarityScript';
import { GoogleAnalyticsScript } from '@/components/legal/GoogleAnalyticsScript';
import {
    JsonLd,
    organizationLd,
    softwareApplicationLd,
    websiteLd,
} from '@/components/seo/JsonLd';
import {
    SITE_URL,
    SITE_NAME,
    SITE_DESCRIPTION,
    TWITTER_HANDLE,
    ogImageUrl,
} from '@/lib/seo';
import './globals.css';

// Hanko brand fonts. Variable names must match the consumers in
// src/styles/tokens.css (--font-fraunces, --font-inter, --font-jetbrains-mono).
const fraunces = Fraunces({
    subsets: ['latin'],
    variable: '--font-fraunces',
    display: 'swap',
    axes: ['opsz'], // optical sizing — what makes display sizes feel warm
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: `${SITE_NAME} — Discipline, made visible.`,
        template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: 'wizeworks', url: SITE_URL }],
    creator: 'wizeworks',
    publisher: 'wizeworks',
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: SITE_URL },
    openGraph: {
        type: 'website',
        url: SITE_URL,
        siteName: SITE_NAME,
        title: `${SITE_NAME} — Discipline, made visible.`,
        description: SITE_DESCRIPTION,
        images: [
            {
                url: ogImageUrl({
                    title: 'Discipline, made visible.',
                    eyebrow: 'wizeworks · kanNINJA',
                    subtitle: SITE_DESCRIPTION,
                }),
                width: 1200,
                height: 630,
                alt: `${SITE_NAME} — Discipline, made visible.`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: TWITTER_HANDLE,
        creator: TWITTER_HANDLE,
        title: `${SITE_NAME} — Discipline, made visible.`,
        description: SITE_DESCRIPTION,
        images: [
            ogImageUrl({
                title: 'Discipline, made visible.',
                eyebrow: 'wizeworks · kanNINJA',
                subtitle: SITE_DESCRIPTION,
            }),
        ],
    },
    icons: {
        icon: '/brand/nin-glyph.svg',
        shortcut: '/brand/nin-icon.svg',
        apple: '/brand/nin-icon.svg',
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider>
            <html
                lang="en"
                suppressHydrationWarning
                data-theme="hanko"
                className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
            >
                <body>
                    <JsonLd data={organizationLd()} />
                    <JsonLd data={websiteLd()} />
                    <JsonLd data={softwareApplicationLd()} />
                    <ThemeProvider>
                        <FontAwesomeProvider>
                            <QueryProvider>
                                <ToastProvider>
                                    <ConsentProvider>
                                        {children}
                                        <CookieBanner />
                                        <CookiePreferencesDialog />
                                        <ClarityScript />
                                        <GoogleAnalyticsScript />
                                    </ConsentProvider>
                                </ToastProvider>
                            </QueryProvider>
                        </FontAwesomeProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
