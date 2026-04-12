'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPen } from '@fortawesome/free-solid-svg-icons';

interface Profile {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    email: string;
}

export default function ProfilePage() {
    const api = useApi();
    const {
        data: profile,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['me'],
        queryFn: () => api.get<{ data: Profile }>('/api/v1/users/me').then((r) => r.data),
    });

    if (isLoading) {
        return (
            <p
                role="status"
                aria-live="polite"
                className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
            >
                Loading your profile…
            </p>
        );
    }

    if (error || !profile) {
        return (
            <div role="alert" className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                    Something on our end
                </p>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                    We couldn&rsquo;t load your{' '}
                    <span className="italic text-primary">profile.</span>
                </h2>
                <p className="mt-3 text-sm text-base-content/70">
                    {error?.message || 'The backend didn\u2019t answer. Try again in a moment.'}
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
        );
    }

    const displayName = profile.displayName ?? 'No name yet';
    const initials =
        profile.displayName
            ?.split(' ')
            .map((s) => s[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'U';

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Profile
                    </p>
                    <h1 className="mt-6 font-display text-4xl md:text-5xl font-medium tracking-tight">
                        How the clan{' '}
                        <span className="italic text-primary">sees you.</span>
                    </h1>
                </div>
                <Link href="/settings" className="btn btn-outline btn-secondary">
                    <FontAwesomeIcon icon={faPen} aria-hidden="true" className="mr-2" />
                    Edit in settings
                </Link>
            </div>

            {/* Profile card */}
            <section
                aria-label="Your profile"
                className="bg-base-100 rounded-lg shadow-e1 p-8 md:p-12"
            >
                <div className="flex items-start gap-8">
                    {/* Avatar */}
                    <div className="shrink-0">
                        <div className="bg-base-300 text-base-content rounded-full w-24 h-24 flex items-center justify-center overflow-hidden">
                            {profile.avatarUrl ? (
                                <Image
                                    src={profile.avatarUrl}
                                    alt=""
                                    width={96}
                                    height={96}
                                    className="rounded-full object-cover"
                                />
                            ) : profile.displayName ? (
                                <span className="text-2xl font-display font-medium">
                                    {initials}
                                </span>
                            ) : (
                                <FontAwesomeIcon
                                    icon={faUser}
                                    aria-hidden="true"
                                    className="text-2xl text-base-content/60"
                                />
                            )}
                        </div>
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                        <h2
                            className={`font-display text-3xl font-medium tracking-tight ${
                                profile.displayName ? '' : 'text-base-content/60 italic'
                            }`}
                        >
                            {displayName}
                        </h2>
                        <p className="mt-2 text-sm text-base-content/70 font-mono">
                            {profile.email}
                        </p>
                    </div>
                </div>

                {/* Bio */}
                <div className="mt-10 pt-8 border-t border-base-300">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60 mb-3">
                        About
                    </p>
                    {profile.bio ? (
                        <p className="text-base leading-relaxed text-base-content/80 max-w-xl">
                            {profile.bio}
                        </p>
                    ) : (
                        <p className="text-sm text-base-content/60 italic">
                            No bio yet. A sentence or two goes a long way.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
