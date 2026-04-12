'use client';

import { faUsersRectangle } from '@fortawesome/free-solid-svg-icons';
import { useDeleteClan } from '@/hooks/use-clans';
import { LinkCard } from '@/components/ui';

interface ClanCardProps {
    id: string;
    name: string;
    description: string | null;
    role: string;
    // True for the auto-created personal clan. We surface a subtle
    // PERSONAL eyebrow tag and suppress the delete affordance — the
    // backend will reject deletion of the personal clan anyway, but
    // hiding the action upfront is cleaner UX.
    isPersonal: boolean;
}

export function ClanCard({ id, name, description, role, isPersonal }: ClanCardProps) {
    const deleteClan = useDeleteClan();

    return (
        <LinkCard
            href={`/clans/${id}`}
            icon={faUsersRectangle}
            title={name}
            description={description}
            metaStart={role}
            metaEnd={
                isPersonal ? (
                    <span className="uppercase tracking-widest text-primary">personal</span>
                ) : undefined
            }
            ariaLabel={`Open ${name}`}
            deleteAction={
                role === 'admin' && !isPersonal
                    ? {
                          onConfirm: async () => {
                              await deleteClan.mutateAsync(id);
                          },
                          isConfirming: deleteClan.isPending,
                          eyebrow: 'Delete clan',
                          title: 'Delete this clan?',
                          body: (
                              <>
                                  &ldquo;{name}&rdquo; and every member in it will be
                                  removed. There is no undo.
                              </>
                          ),
                          confirmLabel: 'Delete clan',
                          ariaLabel: `Delete ${name}`,
                      }
                    : undefined
            }
        />
    );
}
