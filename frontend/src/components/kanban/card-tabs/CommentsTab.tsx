'use client';

import { useState } from 'react';
import {
    useComments,
    useCreateComment,
    useDeleteComment,
} from '@/hooks/use-card-features';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

export function CommentsTab({ boardId, cardId }: { boardId: string; cardId: string }) {
    const { data: comments } = useComments(boardId, cardId);
    const create = useCreateComment(boardId, cardId);
    const del = useDeleteComment(boardId, cardId);
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await create.mutateAsync(content.trim());
        setContent('');
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    className="input input-bordered input-sm flex-1 focus:shadow-focus"
                    placeholder="Leave a note for the clan…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={!content.trim() || create.isPending}
                    aria-label="Send comment"
                >
                    <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
                </button>
            </form>

            <div className="space-y-3 max-h-80 overflow-y-auto">
                {comments?.length === 0 && (
                    <p className="text-sm text-base-content/50 py-4">
                        No notes yet. Be the first.
                    </p>
                )}
                {comments?.map((c) => (
                    <article
                        key={c.id}
                        className="group bg-base-200 rounded-lg p-4 border border-base-300"
                    >
                        <div className="flex items-baseline justify-between gap-3 mb-2">
                            <p className="text-sm font-medium text-base-content">
                                {c.author.displayName ?? 'Anonymous'}
                            </p>
                            <p className="text-eyebrow font-mono text-base-content/40">
                                {new Date(c.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <p className="text-sm text-base-content/80 leading-relaxed">
                            {c.content}
                        </p>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs text-base-content/30 hover:text-error mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => del.mutate(c.id)}
                            aria-label="Delete comment"
                        >
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                        </button>
                    </article>
                ))}
            </div>
        </div>
    );
}
