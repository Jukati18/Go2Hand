'use client';

// src/components/cart/CartToast.tsx
// ─────────────────────────────────────────────────────────────────
// Toast notification system for the cart page.
// Exports: Toast type, useCartToasts hook, ToastStack component.
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react';
import {
    XMarkIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';

// ── Types ─────────────────────────────────────────────────────────
export interface Toast {
    id: string;
    msg: string;
    type: 'ok' | 'err' | 'info';
    undoFn?: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────
export function useCartToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: string) => {
        setToasts(t => t.filter(toast => toast.id !== id));
        const t = timeouts.current.get(id);
        if (t) { clearTimeout(t); timeouts.current.delete(id); }
    }, []);

    const show = useCallback((
        msg: string,
        type: Toast['type'] = 'ok',
        undoFn?: () => void,
    ) => {
        const id = crypto.randomUUID();
        setToasts(t => [...t, { id, msg, type, undoFn }]);
        const timeout = setTimeout(() => dismiss(id), undoFn ? 5000 : 3000);
        timeouts.current.set(id, timeout);
    }, [dismiss]);

    return { toasts, show, dismiss };
}

// ── Single toast item ─────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const bg =
        toast.type === 'err'  ? 'bg-red-600' :
        toast.type === 'info' ? 'bg-gray-800' : 'bg-gray-900';

    return (
        <div className={`pointer-events-auto flex items-center gap-3 ${bg} text-white
            px-4 py-3 rounded-xl shadow-2xl text-sm font-medium
            min-w-[240px] max-w-[340px] animate-[fadeUp_.3s_ease_both]`}>

            {toast.type === 'ok'   && <CheckSolid className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'err'  && <ExclamationTriangleIcon className="w-5 h-5 text-red-200 shrink-0" />}
            {toast.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-300 shrink-0" />}

            <span className="flex-1">{toast.msg}</span>

            {toast.undoFn && (
                <button
                    onClick={() => { toast.undoFn!(); onDismiss(); }}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200
                        border border-amber-400/40 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                >
                    Undo
                </button>
            )}

            <button onClick={onDismiss} className="text-white/40 hover:text-white/80 transition-colors shrink-0">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
}

// ── Stack rendered at bottom-right of screen ──────────────────────
export function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
            ))}
        </div>
    );
}