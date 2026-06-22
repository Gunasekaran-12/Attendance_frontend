/**
 * ToastContext.jsx  (ENHANCED — backward compatible)
 * ---------------------------------------------------
 * Added: loading(message) → returns toast id
 *        dismiss(id?)     → clears one or all loading toasts
 *        duration option  → custom auto-dismiss delay
 * All original exports (success, error, info, warning) unchanged.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', options = {}) => {
        const id = typeof options.id === 'string' ? options.id : `toast-${Date.now()}-${Math.random()}`;
        const duration = options.duration ?? (type === 'loading' ? null : 3500);

        setToasts(prev => {
            // If a toast with this id already exists, replace it
            const exists = prev.find(t => t.id === id);
            if (exists) return prev.map(t => t.id === id ? { ...t, message, type } : t);
            return [...prev, { id, message, type, duration }];
        });

        if (duration) {
            setTimeout(() => removeToast(id), duration);
        }

        return id;
    }, [removeToast]);

    /** Shows a persistent loading toast. Returns toast id for later dismiss. */
    const loading = useCallback((message, options = {}) => {
        return addToast(message, 'loading', { ...options, duration: null });
    }, [addToast]);

    /** Dismiss a specific toast by id, or dismiss ALL loading toasts if no id. */
    const dismiss = useCallback((id) => {
        if (id) {
            removeToast(id);
        } else {
            setToasts(prev => prev.filter(t => t.type !== 'loading'));
        }
    }, [removeToast]);

    const success  = useCallback((msg, opts) => addToast(msg, 'success', opts || {}), [addToast]);
    const error    = useCallback((msg, opts) => addToast(msg, 'error',   opts || {}), [addToast]);
    const info     = useCallback((msg, opts) => addToast(msg, 'info',    opts || {}), [addToast]);
    const warning  = useCallback((msg, opts) => addToast(msg, 'warning', opts || {}), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, warning, loading, dismiss }}>
            {children}
            {/* Toast container — fixed top-right */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence initial={false}>
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

/* ── Individual Toast Component ─────────────────────────────────────── */
const STYLES = {
    success: {
        bar:  'bg-emerald-500',
        icon: 'bg-emerald-100 text-emerald-600',
        ring: 'ring-emerald-200',
        text: 'text-emerald-800',
        sub:  'text-emerald-600',
        emoji: '✓',
    },
    error: {
        bar:  'bg-rose-500',
        icon: 'bg-rose-100 text-rose-600',
        ring: 'ring-rose-200',
        text: 'text-rose-800',
        sub:  'text-rose-600',
        emoji: '✕',
    },
    warning: {
        bar:  'bg-amber-400',
        icon: 'bg-amber-100 text-amber-600',
        ring: 'ring-amber-200',
        text: 'text-amber-800',
        sub:  'text-amber-600',
        emoji: '⚠',
    },
    info: {
        bar:  'bg-blue-500',
        icon: 'bg-blue-100 text-blue-600',
        ring: 'ring-blue-200',
        text: 'text-blue-800',
        sub:  'text-blue-600',
        emoji: 'ℹ',
    },
    loading: {
        bar:  'bg-indigo-500',
        icon: 'bg-indigo-100 text-indigo-600',
        ring: 'ring-indigo-200',
        text: 'text-indigo-800',
        sub:  'text-indigo-600',
        emoji: '⟳',
    },
};

const Toast = ({ id, message, type = 'info', onClose }) => {
    const s = STYLES[type] || STYLES.info;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.92 }}
            animate={{ opacity: 1, x: 0,  scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`
                pointer-events-auto relative overflow-hidden
                flex items-center gap-3 min-w-[300px] max-w-sm
                bg-white rounded-2xl shadow-xl ring-1 ${s.ring} px-4 py-3
            `}
        >
            {/* Left colour bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-2xl`} />

            {/* Icon / Spinner */}
            <div className={`ml-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${s.icon}`}>
                {type === 'loading' ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                ) : s.emoji}
            </div>

            {/* Message */}
            <p className={`flex-1 text-sm font-semibold leading-snug ${s.text}`}>
                {message}
            </p>

            {/* Close button */}
            {type !== 'loading' && (
                <button
                    onClick={onClose}
                    className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
                >
                    ×
                </button>
            )}
        </motion.div>
    );
};

export default ToastContext;
