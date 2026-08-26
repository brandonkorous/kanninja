'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { Field, Input, Textarea } from '@/components/ui';
import { AvatarField } from './AvatarField';

interface Profile {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    email: string;
}

export function ProfileSection() {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();

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

    const updateProfile = useMutation({
        mutationFn: (input: { displayName?: string; bio?: string }) =>
            api.patch('/api/v1/users/me', input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
            toast.success('Profile saved.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });

    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName ?? '');
            setBio(profile.bio ?? '');
        }
    }, [profile]);

    const handleSave = async () => {
        await updateProfile.mutateAsync({
            displayName: displayName.trim() || undefined,
            bio: bio.trim() || undefined,
        });
    };

    return (
        <section className="bg-base-100 rounded-lg shadow-e1 p-8">
            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                Profile
            </p>
            <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                How you <span className="italic text-primary">appear.</span>
            </h2>

            {isLoading && (
                <p
                    role="status"
                    aria-live="polite"
                    className="mt-8 text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                >
                    Loading your profile…
                </p>
            )}

            {error && (
                <div role="alert" className="mt-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                        Something on our end
                    </p>
                    <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
                        We couldn&rsquo;t load your profile.
                    </h3>
                    <p className="mt-3 text-sm text-base-content/70">
                        {error.message || 'Try again in a moment.'}
                    </p>
                    <button
                        type="button"
                        className="btn btn-secondary mt-4"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        {isFetching ? 'Trying…' : 'Try again'}
                    </button>
                </div>
            )}

            {profile && !error && (
                <div className="mt-8 space-y-6">
                    <AvatarField
                        avatarUrl={profile.avatarUrl}
                        displayName={profile.displayName}
                        email={profile.email}
                    />
                    <Field
                        label="Email"
                        htmlFor="profile-email"
                        hint="Manage email in your account provider."
                    >
                        <Input
                            id="profile-email"
                            value={profile.email ?? ''}
                            disabled
                        />
                    </Field>
                    <Field label="Display name" htmlFor="display-name">
                        <Input
                            id="display-name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="What clanmates see"
                        />
                    </Field>
                    <Field label="Bio" htmlFor="bio" optional>
                        <Textarea
                            id="bio"
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="A sentence or two about your practice."
                            maxLength={280}
                        />
                    </Field>
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={updateProfile.isPending}
                        >
                            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
