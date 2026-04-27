'use client';

import Image from 'next/image';
import { useBoards } from '@/hooks/use-boards';
import { BoardCard } from '@/components/board/BoardCard';
import { BoardCardSkeleton } from '@/components/board/BoardCardSkeleton';
import { CreateBoardModal } from '@/components/board/CreateBoardModal';
import { PinnedHighlights } from '@/components/dashboard/PinnedHighlights';

export default function DashboardPage() {
    const { data: boards, isLoading, error, refetch, isFetching } = useBoards();

    const ownedCount = boards?.filter((b) => b.role === 'owner').length ?? 0;
    const totalCount = boards?.length ?? 0;
    const subtitle = totalCount
        ? `${totalCount} ${totalCount === 1 ? 'dojo' : 'dojos'} · ${ownedCount} you own`
        : 'Nothing here yet.';

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Your practice
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        Your <span className="italic text-primary">dojos.</span>
                    </h1>
                    <p className="mt-4 text-base text-base-content/60">{subtitle}</p>
                </div>
                <CreateBoardModal />
            </div>

            <PinnedHighlights />

            <section aria-label="Your dojos">
                {/* Loading — skeleton grid */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
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
                            <span className="italic text-primary">dojos.</span>
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
                {boards && boards.length === 0 && (
                    <div className="bg-base-100 rounded-lg shadow-e1 p-12 md:p-16 max-w-2xl flex flex-col items-start">
                        <Image
                            src="/brand/nin-icon.svg"
                            alt=""
                            width={80}
                            height={80}
                            className="h-20 w-20"
                        />
                        <h2 className="mt-10 font-display text-3xl font-medium tracking-tight">
                            Nothing here <span className="italic text-primary">yet.</span>
                        </h2>
                        <p className="mt-4 text-base text-base-content/70 max-w-md">
                            Open your first dojo. Your first kata is one keystroke away.
                        </p>
                        <div className="mt-10">
                            <CreateBoardModal />
                        </div>
                    </div>
                )}

                {/* Boards grid */}
                {boards && boards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {boards.map((board) => (
                            <BoardCard
                                key={board.id}
                                id={board.id}
                                title={board.title}
                                description={board.description}
                                role={board.role}
                                updatedAt={board.updatedAt}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
