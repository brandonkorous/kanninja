'use client';

import { useRef } from 'react';
import {
    useAttachments,
    useUploadAttachment,
    useDeleteAttachment,
} from '@/hooks/use-card-features';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faFile } from '@fortawesome/free-solid-svg-icons';

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsTab({
    boardId,
    cardId,
}: {
    boardId: string;
    cardId: string;
}) {
    const { data: attachments } = useAttachments(boardId, cardId);
    const upload = useUploadAttachment(boardId, cardId);
    const del = useDeleteAttachment(boardId, cardId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await upload.mutateAsync(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                />
                <button
                    type="button"
                    className="btn btn-outline btn-secondary w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={upload.isPending}
                >
                    <FontAwesomeIcon icon={faUpload} aria-hidden="true" className="mr-2" />
                    {upload.isPending ? 'Uploading…' : 'Attach a file'}
                </button>
            </div>

            <div>
                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 mb-4">
                    Files
                </p>
                {attachments?.length === 0 && (
                    <p className="text-sm text-base-content/50">
                        Nothing attached yet.
                    </p>
                )}
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                    {attachments?.map((att) => (
                        <li
                            key={att.id}
                            className="group flex items-center gap-3 bg-base-200 rounded-md p-3 border border-base-300"
                        >
                            <FontAwesomeIcon
                                icon={faFile}
                                aria-hidden="true"
                                className="text-base-content/50"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-base-content truncate">
                                    {att.fileName}
                                </p>
                                <p className="text-eyebrow font-mono text-base-content/40">
                                    {formatBytes(att.fileSize)}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-base-content/30 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => del.mutate(att.id)}
                                aria-label={`Delete ${att.fileName}`}
                            >
                                <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
