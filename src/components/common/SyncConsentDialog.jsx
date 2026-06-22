/**
 * SyncConsentDialog.jsx
 * ---------------------
 * Appears ONCE PER SESSION when the user comes back online
 * and has pending attendance records to sync.
 *
 * Options:
 *  - Sync Now        → triggers immediate sync
 *  - Skip            → dismisses, no sync
 *  - Auto-sync always → saves preference, bypasses dialog in future
 *
 * Session tracking: sessionStorage key 'sync_consent_shown'
 * Auto-sync preference: localStorage key 'auto_sync_preference'
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudUpload, X, Zap, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { syncPendingAttendance } from '../../utils/offlineSync';
import { useToast } from '../../context/ToastContext';
import { logSyncEvent, SYNC_EVENTS } from '../../utils/syncLogger';

const SESSION_KEY  = 'sync_consent_shown';
const AUTO_SYNC_KEY = 'auto_sync_preference';

const SyncConsentDialog = () => {
    const { isOnline, pendingCount, refreshCounts, setIsSyncing } = useNetwork();
    const toast = useToast();

    const [visible, setVisible]   = useState(false);
    const [syncing, setSyncing]   = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Check if we should show the dialog when coming online with pending records
    useEffect(() => {
        if (!isOnline || pendingCount === 0) return;

        const alreadyShown   = sessionStorage.getItem(SESSION_KEY);
        const autoSyncEnabled = localStorage.getItem(AUTO_SYNC_KEY) === 'true';

        if (autoSyncEnabled) {
            // Silent auto-sync — no dialog
            triggerSync(false);
            return;
        }

        if (!alreadyShown) {
            setVisible(true);
            sessionStorage.setItem(SESSION_KEY, 'true');
            logSyncEvent(SYNC_EVENTS.CONSENT_SHOWN, { pendingCount });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, pendingCount]);

    const triggerSync = useCallback(async (showDialog = true) => {
        if (showDialog) setVisible(false);
        setSyncing(true);
        setIsSyncing(true);

        const toastId = toast.loading(`Syncing ${pendingCount} attendance records…`);
        try {
            await syncPendingAttendance((current, total) => {
                setProgress({ current, total });
            });
            toast.dismiss(toastId);
            toast.success('All records synced to cloud successfully! ✓');
            await refreshCounts();
        } catch {
            toast.dismiss(toastId);
            toast.error('Sync failed for some records. Retry manually.');
        } finally {
            setSyncing(false);
            setIsSyncing(false);
            setProgress({ current: 0, total: 0 });
        }
    }, [pendingCount, toast, refreshCounts, setIsSyncing]);

    const handleSyncNow = () => triggerSync(true);

    const handleAutoSync = async () => {
        localStorage.setItem(AUTO_SYNC_KEY, 'true');
        logSyncEvent(SYNC_EVENTS.AUTO_SYNC_ENABLED);
        toast.info('Auto-sync enabled. Records will sync automatically.');
        await triggerSync(true);
    };

    const handleSkip = () => {
        setVisible(false);
        toast.info('Sync skipped. Records remain saved locally.');
    };

    return (
        <>
            {/* ─── Consent Modal ───────────────────────────────────────── */}
            <AnimatePresence>
                {visible && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9000]"
                            onClick={handleSkip}
                        />

                        {/* Dialog Panel */}
                        <motion.div
                            key="dialog"
                            initial={{ opacity: 0, scale: 0.88, y: 40 }}
                            animate={{ opacity: 1, scale: 1,    y: 0 }}
                            exit={{ opacity: 0, scale: 0.92,    y: 20 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                            className="fixed inset-0 flex items-center justify-center z-[9001] p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                                {/* Header gradient */}
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 relative">
                                    <button
                                        onClick={handleSkip}
                                        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-4">
                                        <CloudUpload className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-extrabold text-white leading-tight">
                                        Attendance Data Ready to Sync
                                    </h2>
                                    <p className="text-indigo-100 text-sm mt-1">
                                        Internet connection restored
                                    </p>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-5">
                                    {/* Stats */}
                                    <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-indigo-900">{pendingCount}</p>
                                            <p className="text-sm text-indigo-600 font-semibold">
                                                attendance {pendingCount === 1 ? 'record' : 'records'} saved offline
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        These records are securely stored on this device. Sync them to the cloud
                                        now to ensure they are saved and accessible from all devices.
                                    </p>

                                    {/* Action buttons */}
                                    <div className="flex flex-col gap-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSyncNow}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 transition-colors"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            Sync Now
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleAutoSync}
                                            className="w-full flex items-center justify-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold py-3.5 px-6 rounded-2xl border border-violet-200 transition-colors"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Enable Auto-sync Always
                                        </motion.button>

                                        <button
                                            onClick={handleSkip}
                                            className="w-full text-slate-400 hover:text-slate-600 text-sm font-semibold py-2 transition-colors"
                                        >
                                            Skip for now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Inline sync progress (shown during sync) ─────────────── */}
            <AnimatePresence>
                {syncing && (
                    <motion.div
                        key="sync-progress"
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9002]
                                   bg-white rounded-2xl shadow-2xl border border-slate-100
                                   px-6 py-4 flex items-center gap-4 min-w-[280px]"
                    >
                        <svg className="animate-spin w-6 h-6 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">
                                {progress.total > 0
                                    ? `Syncing ${progress.current} / ${progress.total}…`
                                    : 'Syncing records…'
                                }
                            </p>
                            {progress.total > 0 && (
                                <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-500 rounded-full"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            )}
                        </div>
                        {progress.current === progress.total && progress.total > 0 && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SyncConsentDialog;
