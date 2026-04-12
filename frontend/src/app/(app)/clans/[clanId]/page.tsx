'use client';

import { useId, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClan, useClanMembers, useUpdateClan } from '@/hooks/use-clans';
import { useClanPermissions } from '@/hooks/use-permissions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { InlineEditTitle, InlineEditDescription } from '@/components/ui';
import { InviteClanModal } from '@/components/clan/InviteClanModal';
import { ClanMemberRow } from '@/components/clan/ClanMemberRow';
import { ClanAccessSection } from '@/components/clan/ClanAccessSection';

export default function ClanDetailPage() {
    const params = useParams();
    const clanId = params.clanId as string;
    const { data: clan, isLoading, error } = useClan(clanId);
    const { data: members } = useClanMembers(clanId);
    const updateClan = useUpdateClan(clanId);
    // Same shape as useDojoPermissions — reads role from the cached
    // useClan query so any descendant can call the hook directly
    // instead of receiving canManage as a prop.
    const { canManage } = useClanPermissions(clanId);

    const [showInvite, setShowInvite] = useState(false);
    const membersHeadingId = useId();

    if (isLoading) {
        return (
            <p
                role="status"
                aria-live="polite"
                className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
            >
                Looking up the clan…
            </p>
        );
    }

    if (error || !clan) {
        return (
            <div role="alert" className="bg-base-100 rounded-lg shadow-e1 p-8 max-w-xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                    Something on our end
                </p>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                    We couldn&rsquo;t find this{' '}
                    <span className="italic text-primary">clan.</span>
                </h2>
                <p className="mt-3 text-sm text-base-content/70">
                    It may have been disbanded, or you may have lost access.
                </p>
                <Link href="/clans" className="btn btn-secondary mt-6">
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" className="mr-2" />
                    Back to clans
                </Link>
            </div>
        );
    }

    const memberCount = members?.length ?? 0;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-12">
                <Link
                    href="/clans"
                    className="inline-flex items-center gap-2 text-eyebrow font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                    Back to clans
                </Link>
                <InlineEditTitle
                    value={clan.name}
                    canEdit={canManage}
                    entityLabel="clan name"
                    onSave={(name) => updateClan.mutateAsync({ name })}
                />
                <InlineEditDescription
                    value={clan.description}
                    canEdit={canManage}
                    placeholder="Describe this clan…"
                    emptyLabel="Add a description"
                    onSave={(description) =>
                        updateClan.mutateAsync({ description })
                    }
                />
            </header>

            {/* Members */}
            <section
                aria-labelledby={membersHeadingId}
                className="bg-base-100 rounded-lg shadow-e1 overflow-hidden"
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-base-300">
                    <div>
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Members
                        </p>
                        <h2
                            id={membersHeadingId}
                            className="mt-2 font-display text-2xl font-medium tracking-tight"
                        >
                            {memberCount}{' '}
                            <span className="text-base-content/60 text-lg">
                                {memberCount === 1 ? 'clanmate' : 'clanmates'}
                            </span>
                        </h2>
                    </div>
                    {canManage && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            aria-haspopup="dialog"
                            onClick={() => setShowInvite(true)}
                        >
                            <FontAwesomeIcon
                                icon={faUserPlus}
                                aria-hidden="true"
                                className="mr-2"
                            />
                            Invite
                        </button>
                    )}
                </div>

                <ul>
                    {memberCount === 0 && (
                        <li className="px-8 py-10 text-sm text-base-content/70">
                            No clanmates yet. Invite the first.
                        </li>
                    )}
                    {members?.map((member) => (
                        <ClanMemberRow
                            key={member.id}
                            clanId={clanId}
                            member={member}
                        />
                    ))}
                </ul>
            </section>

            <ClanAccessSection clanId={clanId} />

            <InviteClanModal
                clanId={clanId}
                open={showInvite}
                onClose={() => setShowInvite(false)}
            />
        </div>
    );
}
