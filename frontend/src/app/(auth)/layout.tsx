import Link from 'next/link';
import { Wordmark } from '@/components/layout/wordmark';

// Split-screen chrome for all auth surfaces (sign-in, sign-up, sso-callback,
// invite). Sumi brand panel on the left (desktop) collapses to a thin top
// bar on mobile. Cream form panel on the right fills the remaining space.
//
// The brand panel mirrors the marketing closing panel language: vermillion
// eyebrow, display Fraunces headline, the 忍 seal at its largest. The form
// panel uses the Washi cream paper background from the marketing site — the
// visitor should feel continuity between "Start a kata" and the sign-up form.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Mobile — thin brand bar */}
            <div className="md:hidden bg-neutral text-neutral-content h-16 flex items-center justify-between px-6 border-b border-neutral-content/10">
                <Link
                    href="/"
                    className="focus-visible:shadow-focus rounded-md -mx-1 px-1"
                >
                    <Wordmark size="sm" />
                </Link>
                <Link
                    href="/"
                    className="text-eyebrow font-mono uppercase tracking-widest text-neutral-content/60 hover:text-neutral-content transition-colors"
                >
                    Home
                </Link>
            </div>

            {/* Desktop — full brand panel */}
            <aside className="hidden md:flex md:w-2/5 lg:w-1/2 bg-neutral text-neutral-content px-12 lg:px-16 xl:px-20 py-16 flex-col justify-between relative overflow-hidden">
                <Link
                    href="/"
                    className="focus-visible:shadow-focus rounded-md -mx-1 px-1 self-start"
                >
                    <Wordmark size="lg" />
                </Link>

                {/* Middle — brand promise */}
                <div className="hanko-rise max-w-lg">
                    <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Welcome to the dojo
                    </p>
                    <h2 className="hanko-rise hanko-rise-1 mt-10 font-display text-5xl lg:text-6xl font-medium tracking-tight">
                        Discipline,{' '}
                        <span className="hanko-brush italic text-primary">made visible.</span>
                    </h2>
                    <p className="hanko-rise hanko-rise-2 mt-10 text-lg leading-relaxed text-neutral-content/70 max-w-md">
                        A kanban that respects your attention. The work in front of you,
                        in the order you'll finish it.
                    </p>
                </div>

                {/* Bottom — quiet footer */}
                <p className="text-eyebrow font-mono uppercase tracking-widest text-neutral-content/40">
                    kanNINJA · The Hanko System
                </p>
            </aside>

            {/* Form panel */}
            <main className="flex-1 flex items-center justify-center bg-base-200 p-6 md:p-12 lg:p-16">
                <div className="w-full max-w-md">{children}</div>
            </main>
        </div>
    );
}
