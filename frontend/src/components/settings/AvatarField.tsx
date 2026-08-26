'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

// Mirrors the server. Checked here too so a 3MB photo fails in the file
// picker instead of after the upload has crossed the wire.
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 2 * 1024 * 1024;

interface AvatarFieldProps {
    avatarUrl: string | null;
    displayName: string | null;
    email: string;
}

export function AvatarField({ avatarUrl, displayName, email }: AvatarFieldProps) {
    const qc = useQueryClient();
    const toast = useToast();
    const fileInput = useRef<HTMLInputElement>(null);
    // Shows the chosen image immediately, before the round trip finishes.
    const [preview, setPreview] = useState<string | null>(null);

    const initials =
        (displayName ?? email)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || '?';

    const upload = useMutation({
        mutationFn: (file: File) =>
            api.postBinary<{ data: { avatarUrl: string } }>('/api/v1/users/me/avatar', file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['me'] });
            toast.success('Picture updated.');
        },
        onError: (err) => {
            setPreview(null);
            toast.error(getToastErrorMessage(err));
        },
    });

    const remove = useMutation({
        mutationFn: () => api.delete('/api/v1/users/me/avatar'),
        onSuccess: () => {
            setPreview(null);
            qc.invalidateQueries({ queryKey: ['me'] });
            toast.success('Picture removed.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });

    const busy = upload.isPending || remove.isPending;

    const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Reset so picking the SAME file twice still fires a change event.
        event.target.value = '';
        if (!file) return;

        if (!ACCEPTED.includes(file.type)) {
            toast.error('Pick a JPEG, PNG, WebP, or GIF.');
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error(`That image is ${Math.round(file.size / 1024)}KB. The limit is 2MB.`);
            return;
        }

        setPreview(URL.createObjectURL(file));
        upload.mutate(file);
    };

    const shown = preview ?? avatarUrl;

    return (
        <div className="flex items-center gap-6">
            <div className="bg-base-300 text-base-content rounded-full w-20 h-20 shrink-0 flex items-center justify-center overflow-hidden">
                {shown ? (
                    preview ? (
                        // A blob: URL from the file picker — next/image cannot
                        // optimise one, and there is nothing to optimise.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shown} alt="" className="w-20 h-20 object-cover" />
                    ) : (
                        <Image
                            src={shown}
                            alt=""
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover"
                        />
                    )
                ) : displayName ? (
                    <span className="text-xl font-display font-medium">{initials}</span>
                ) : (
                    <FontAwesomeIcon
                        icon={faUser}
                        aria-hidden="true"
                        className="text-xl text-base-content/60"
                    />
                )}
            </div>

            <div className="min-w-0">
                <p className="text-sm font-medium">Picture</p>
                <p className="mt-1 text-xs text-base-content/70">
                    JPEG, PNG, WebP, or GIF. Up to 2MB.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                        ref={fileInput}
                        type="file"
                        accept={ACCEPTED.join(',')}
                        onChange={handleFile}
                        className="hidden"
                    />
                    <button
                        type="button"
                        className="btn btn-outline btn-secondary btn-sm"
                        onClick={() => fileInput.current?.click()}
                        disabled={busy}
                    >
                        {upload.isPending ? 'Uploading…' : avatarUrl ? 'Replace' : 'Choose a photo'}
                    </button>
                    {avatarUrl && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => remove.mutate()}
                            disabled={busy}
                        >
                            {remove.isPending ? 'Removing…' : 'Remove'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
