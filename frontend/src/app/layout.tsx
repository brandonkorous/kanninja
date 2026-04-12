import type { Metadata } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { FontAwesomeProvider } from '@/providers/FontAwesomeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
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
    title: 'kanNINJA - AI-Powered Kanban Board',
    description:
        'Supercharge your project management with AI-powered kanban boards, real-time collaboration, and intelligent task automation.',
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
                    <ThemeProvider>
                        <FontAwesomeProvider>
                            <QueryProvider>
                                <ToastProvider>{children}</ToastProvider>
                            </QueryProvider>
                        </FontAwesomeProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
