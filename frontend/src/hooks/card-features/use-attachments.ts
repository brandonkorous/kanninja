'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../use-api';
import { useToast } from '@/providers/ToastProvider';
import { getToastErrorMessage } from '@/lib/toast-errors';

interface Attachment {
    id: string;
    cardId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
}

export function useAttachments(boardId: string, cardId: string) {
    const api = useApi();
    return useQuery({
        queryKey: ['attachments', cardId],
        queryFn: () =>
            api
                .get<{ data: Attachment[] }>(`/api/v1/boards/${boardId}/cards/${cardId}/attachments`)
                .then((r) => r.data),
        enabled: !!cardId,
    });
}

export function useUploadAttachment(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: async (file: File) => {
            const urlRes = await api.post<{ data: { uploadUrl: string; path: string } }>(
                `/api/v1/boards/${boardId}/cards/${cardId}/attachments/upload-url`,
                { fileName: file.name, fileSize: file.size, mimeType: file.type },
            );

            // Upload the file directly to Supabase Storage
            const uploadRes = await fetch(urlRes.data.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });
            if (!uploadRes.ok) throw new Error('Upload failed. Try again in a moment.');

            // Finalize the metadata
            return api.post(`/api/v1/boards/${boardId}/cards/${cardId}/attachments`, {
                fileName: file.name,
                filePath: urlRes.data.path,
                fileSize: file.size,
                mimeType: file.type,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attachments', cardId] });
            toast.success('File attached.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}

export function useDeleteAttachment(boardId: string, cardId: string) {
    const api = useApi();
    const qc = useQueryClient();
    const toast = useToast();
    return useMutation({
        mutationFn: (attachmentId: string) =>
            api.delete(`/api/v1/boards/${boardId}/cards/${cardId}/attachments/${attachmentId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['attachments', cardId] });
            toast.success('File removed.');
        },
        onError: (err) => toast.error(getToastErrorMessage(err)),
    });
}
