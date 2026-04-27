import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Wordmark } from '@/components/layout/wordmark';

const navLinkClass =
    'text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-3 py-2 transition-colors';

// Footer columns mirror the brand kit's 4-column closing pattern (SOURCE OF TRUTH /
// TYPE LOADING / DARK MODE / VERSIONING) with site nav content. The "Dojo" label is
// the Hanko-flavored substitute for "Resources" — the dojo is where you train.
const footerColumns: { label: string; links: { href: string; label: string }[] }[] = [
    {
        label: 'Product',
        links: [
            { href: '/features', label: 'Features' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/mcp', label: 'MCP' },
            { href: '/for', label: 'For everyone' },
            { href: '/vs', label: 'Compare' },
            { href: '/changelog', label: 'Changelog' },
        ],
    },
    {
        label: 'Company',
        links: [
            { href: '/about', label: 'About' },
            { href: '/blog', label: 'Field notes' },
            { href: '/careers', label: 'Careers' },
            { href: '/contact', label: 'Contact' },
        ],
    },
    {
        label: 'Dojo',
        links: [
            { href: '/docs', label: 'Documentation' },
            { href: '/api', label: 'API reference' },
            { href: '/brand', label: 'Brand kit' },
            { href: '/status', label: 'Status' },
        ],
    },
    {
        label: 'Legal',
        links: [
            { href: '/privacy', label: 'Privacy' },
            { href: '/terms', label: 'Terms' },
            { href: '/cookies', label: 'Cookies' },
            { href: '/aup', label: 'Acceptable use' },
            { href: '/dpa', label: 'DPA' },
            { href: '/subprocessors', label: 'Subprocessors' },
            { href: '/refund', label: 'Refunds' },
            {
                href: '/privacy-choices',
                label: 'Do Not Sell or Share My Personal Information',
            },
        ],
    },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-base-200">
            <header className="sticky top-0 z-50 bg-base-200/80 backdrop-blur-md border-b border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 h-16 flex items-center justify-between">
                    <Link
                        href="/"
                        className="focus-visible:shadow-focus rounded-sm px-1"
                    >
                        <Wordmark size="md" />
                    </Link>
                    <nav className="flex items-center gap-1 md:gap-2">
                        <Link href="/features" className={`${navLinkClass} hidden md:inline-flex`}>
                            Features
                        </Link>
                        <Link href="/pricing" className={`${navLinkClass} hidden md:inline-flex`}>
                            Pricing
                        </Link>
                        <Link href="/mcp" className={`${navLinkClass} hidden md:inline-flex`}>
                            MCP
                        </Link>
                        <Link href="/about" className={`${navLinkClass} hidden md:inline-flex`}>
                            About
                        </Link>
                        <SignedOut>
                            <Link
                                href="/sign-in"
                                className="text-sm font-mono uppercase tracking-widest text-base-content hover:text-primary focus-visible:shadow-focus rounded-sm px-3 py-2 transition-colors"
                            >
                                Sign in
                            </Link>
                        </SignedOut>
                        <SignedIn>
                            <Link
                                href="/dashboard"
                                className="text-sm font-mono uppercase tracking-widest text-base-content hover:text-primary focus-visible:shadow-focus rounded-sm px-3 py-2 transition-colors"
                            >
                                Dashboard
                            </Link>
                            <div className="ml-2 flex items-center">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </SignedIn>
                    </nav>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 lg:pt-32 pb-10">
                    {/* Brand statement — wordmark + stamp + tagline, generous left bias */}
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-12 md:gap-20 items-start">
                        <div>
                            <Wordmark size="xl" />
                            <p className="mt-2 text-sm text-neutral-content/60 max-w-xs">
                                A kanban for people who want their work to feel like a
                                practice.
                            </p>
                        </div>
                        {/* Four nav columns */}
                        <nav
                            aria-label="Footer"
                            className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12"
                        >
                            {footerColumns.map((col) => (
                                <div key={col.label}>
                                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                        {col.label}
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        {col.links.map((link) => (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="text-sm text-neutral-content/70 hover:text-neutral-content focus-visible:shadow-focus rounded-sm transition-colors"
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </nav>
                    </div>
                    {/* Bottom strip — wordmark + version mirrors brand kit footer */}
                    <div className="mt-20 pt-8 border-t border-neutral-content/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-neutral-content/50">
                            kanNINJA · The Hanko System
                        </p>
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-neutral-content/50">
                            v0.1.0 · {new Date().getFullYear()} · © wizeworks
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
