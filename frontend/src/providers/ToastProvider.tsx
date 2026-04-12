'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faInfo } from '@fortawesome/free-solid-svg-icons';

// Minimal voice-aligned toast system. Two words, three seconds, gone.
// No dependencies — React context + useState + setTimeout.
//
// The whole point: mutation feedback should feel like a seal pressing paper,
// not a dialog. Toasts live in the bottom-right on desktop and the top-center
// on mobile so they never cover the primary action area.

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    kind: ToastKind;
    message: string;
}

interface ToastContextValue {
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
    };
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Timings calibrated to the voice skill's "three seconds, gone" rule.
// Error toasts linger slightly longer because you need time to read them.
const DURATION_SUCCESS = 2800;
const DURATION_ERROR = 4500;
const DURATION_INFO = 3200;
const MAX_STACK = 4;

let idCounter = 0;
const nextId = () => `toast-${++idCounter}`;

function durationFor(kind: ToastKind): number {
    if (kind === 'error') return DURATION_ERROR;
    if (kind === 'info') return DURATION_INFO;
    return DURATION_SUCCESS;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((kind: ToastKind, message: string) => {
        const id = nextId();
        setToasts((prev) => {
            const next = [...prev, { id, kind, message }];
            // Cap the stack; drop the oldest if we exceed MAX_STACK
            return next.length > MAX_STACK ? next.slice(-MAX_STACK) : next;
        });
    }, []);

    const api = useMemo(
        () => ({
            toast: {
                success: (message: string) => push('success', message),
                error: (message: string) => push('error', message),
                info: (message: string) => push('info', message),
            },
        }),
        [push],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx.toast;
}

// Viewport — fixed position container for the stack. Mobile: top center.
// Desktop: bottom right. Stays out of the way of primary actions on both.
function ToastViewport({
    toasts,
    onDismiss,
}: {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}) {
    if (toasts.length === 0) return null;
    return (
        <div
            role="region"
            aria-label="Notifications"
            className="fixed z-[60] pointer-events-none flex flex-col gap-3 top-4 left-1/2 -translate-x-1/2 w-[min(calc(100vw-2rem),22rem)] md:top-auto md:left-auto md:translate-x-0 md:bottom-6 md:right-6"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: Toast;
    onDismiss: (id: string) => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), durationFor(toast.kind));
        return () => clearTimeout(timer);
    }, [toast.id, toast.kind, onDismiss]);

    const icon =
        toast.kind === 'success' ? faCheck : toast.kind === 'error' ? faTimes : faInfo;

    // Sumi-ink surface by default; error tints toward vermillion. The icon
    // chip is the only accent color — the body stays in the neutral content
    // color so the toast reads as a stamp, not a banner.
    const iconColor =
        toast.kind === 'error'
            ? 'text-primary'
            : toast.kind === 'success'
              ? 'text-primary'
              : 'text-neutral-content/70';

    return (
        <div
            role="status"
            className="hanko-rise bg-neutral text-neutral-content rounded-lg shadow-e4 border border-neutral-content/10 px-5 py-4 flex items-center gap-4 pointer-events-auto"
        >
            <FontAwesomeIcon
                icon={icon}
                aria-hidden="true"
                className={`shrink-0 text-sm ${iconColor}`}
            />
            <p className="text-sm leading-snug flex-1">{toast.message}</p>
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-neutral-content/40 hover:text-neutral-content transition-colors shrink-0"
                aria-label="Dismiss"
            >
                <FontAwesomeIcon icon={faTimes} aria-hidden="true" className="text-xs" />
            </button>
        </div>
    );
}
