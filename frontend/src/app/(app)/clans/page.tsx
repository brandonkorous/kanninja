'use client';

import Image from 'next/image';
import { useClans } from '@/hooks/use-clans';
import { ClanCard } from '@/components/clan/ClanCard';
import { CreateClanModal } from '@/components/clan/CreateClanModal';
import { BoardCardSkeleton } from '@/components/board/BoardCardSkeleton';

export default function ClansPage() {
    const { data: clans, isLoading, error, refetch, isFetching } = useClans();

    const totalCount = clans?.length ?? 0;
    const adminCount = clans?.filter((c) => c.role === 'admin').length ?? 0;
    const subtitle = totalCount
        ? `${totalCount} ${totalCount === 1 ? 'clan' : 'clans'} · ${adminCount} you lead`
        : 'Nothing here yet.';

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Your people
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Your <span className="italic text-primary">clans.</span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60">{subtitle}</p>
                </div>
                <CreateClanModal />
            </div>

            <section aria-label="Your clans">
                {/* Loading — skeleton grid */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <BoardCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Error — announced to assistive tech + retry */}
                {error && (
                    <div
                        role="alert"
                        className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl"
                    >
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                            Something on our end
                        </p>
                        <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                            We couldn&rsquo;t load your{' '}
                            <span className="italic text-primary">clans.</span>
                        </h2>
                        <p className="mt-3 text-sm text-base-content/70">
                            The backend didn&rsquo;t answer. Try again in a moment.
                        </p>
                        <button
                            type="button"
                            className="btn btn-secondary mt-6"
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            {isFetching ? 'Trying…' : 'Try again'}
                        </button>
                    </div>
                )}

                {/* Empty state — left-aligned, Hanko principle */}
                {clans && clans.length === 0 && (
                    <div className="bg-base-100 rounded-lg shadow-e1 p-12 md:p-16 max-w-2xl flex flex-col items-start">
                        <Image
                            src="/brand/nin-icon.svg"
                            alt=""
                            width={80}
                            height={80}
                            className="h-20 w-20"
                        />
                        <h2 className="mt-10 font-display text-3xl font-medium tracking-tight">
                            No clans <span className="italic text-primary">yet.</span>
                        </h2>
                        <p className="mt-4 text-base text-base-content/70 max-w-md">
                            Start a clan to train with others. A clan groups boards and
                            members under the same roof.
                        </p>
                        <div className="mt-10">
                            <CreateClanModal />
                        </div>
                    </div>
                )}

                {/* Grid */}
                {clans && clans.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clans.map((clan) => (
                            <ClanCard
                                key={clan.id}
                                id={clan.id}
                                name={clan.name}
                                description={clan.description}
                                role={clan.role}
                                isPersonal={clan.isPersonal}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
