/**
 * GlobalSyncBar.jsx
 * -----------------
 * A slim, persistent status bar rendered below the Navbar.
 * Visible across ALL pages (mounted in DashboardLayout).
 *
 * Shows:
 *  🟢 Online + pending count badge
 *  🔴 Offline – Saving Locally
 *  🟡 Unstable – Weak Connection
 *  🔵 Syncing… X/Y records (with animated progress bar)
 *  ✅ All Synced (auto-hides after 4 s)
 *  🔴 X Failed – Retry button
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, CloudUpload, AlertTriangle, CheckCircle2, RefreshCw, HardDrive } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { syncPendingAttendance, retryFailedAttendance } from '../../utils/offlineSync';
import { useToast } from '../../context/ToastContext';

const AUTO_SYNC_KEY = 'auto_sync_preference';

const GlobalSyncBar = () => {
    const { isOnline, networkStatus, pendingCount, failedCount, isSyncing, setIsSyncing, refreshCounts } = useNetwork();
    const toast = useToast();

    const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
    const [showAllSynced, setShowAllSynced] = useState(false);
    const prevPendingRef = useRef(pendingCount);
    const allSyncedTimer = useRef(null);

    // Detect when pending → 0 to flash "All Synced" state
    useEffect(() => {
        if (prevPendingRef.current > 0 && pendingCount === 0 && failedCount === 0 && isOnline) {
            setShowAllSynced(true);
            clearTimeout(allSyncedTimer.current);
            allSyncedTimer.current = setTimeout(() => setShowAllSynced(false), 4000);
        }
        prevPendingRef.current = pendingCount;
    }, [pendingCount, failedCount, isOnline]);

    const handleSyncNow = async () => {
        if (isSyncing || !isOnline || pendingCount === 0) return;
        setIsSyncing(true);
        const toastId = toast.loading(`Syncing ${pendingCount} records…`);
        try {
            await syncPendingAttendance((current, total) => {
                setSyncProgress({ current, total });
            });
            toast.dismiss(toastId);
            toast.success('Sync complete! All records uploaded.');
            await refreshCounts();
        } catch {
            toast.dismiss(toastId);
            toast.error('Sync failed. Will retry automatically.');
        } finally {
            setIsSyncing(false);
            setSyncProgress({ current: 0, total: 0 });
        }
    };

    const handleRetryFailed = async () => {
        if (isSyncing || !isOnline) return;
        setIsSyncing(true);
        const toastId = toast.loading(`Retrying ${failedCount} failed records…`);
        try {
            await retryFailedAttendance((current, total) => {
                setSyncProgress({ current, total });
            });
            toast.dismiss(toastId);
            toast.success('Failed records retried successfully!');
            await refreshCounts();
        } catch {
            toast.dismiss(toastId);
            toast.error('Retry failed. Check connection and try again.');
        } finally {
            setIsSyncing(false);
            setSyncProgress({ current: 0, total: 0 });
        }
    };

    const autoSyncOn = localStorage.getItem(AUTO_SYNC_KEY) === 'true';

    /* ── Determine which bar state to render ── */
    const bar = (() => {
        if (isSyncing) return 'syncing';
        if (showAllSynced) return 'synced';
        if (networkStatus === 'OFFLINE') return 'offline';
        if (networkStatus === 'UNSTABLE') return 'unstable';
        if (failedCount > 0) return 'failed';
        if (pendingCount > 0) return 'pending';
        return 'clean';
    })();

    // Hide bar when fully clean + online (no noise)
    if (bar === 'clean') return null;

    const config = {
        syncing: {
            bg: 'from-indigo-600 to-violet-600',
            text: 'text-white',
            icon: <RefreshCw className="w-4 h-4 animate-spin" />,
            label: syncProgress.total > 0
                ? `Syncing ${syncProgress.current} / ${syncProgress.total} records…`
                : `Syncing ${pendingCount} records…`,
        },
        synced: {
            bg: 'from-emerald-500 to-teal-500',
            text: 'text-white',
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: 'All attendance records synced to cloud ✓',
        },
        offline: {
            bg: 'from-rose-500 to-pink-600',
            text: 'text-white',
            icon: <WifiOff className="w-4 h-4" />,
            label: 'Offline — Attendance is being saved locally',
        },
        unstable: {
            bg: 'from-amber-400 to-orange-500',
            text: 'text-white',
            icon: <AlertTriangle className="w-4 h-4" />,
            label: 'Weak connection — Records are still saving locally',
        },
        failed: {
            bg: 'from-rose-600 to-red-700',
            text: 'text-white',
            icon: <AlertTriangle className="w-4 h-4" />,
            label: `${failedCount} record${failedCount > 1 ? 's' : ''} failed to sync`,
        },
        pending: {
            bg: 'from-blue-600 to-indigo-600',
            text: 'text-white',
            icon: <HardDrive className="w-4 h-4" />,
            label: `${pendingCount} record${pendingCount > 1 ? 's' : ''} pending sync`,
        },
    };

    const c = config[bar];

    return (
        <AnimatePresence>
            <motion.div
                key={bar}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`bg-gradient-to-r ${c.bg} ${c.text}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-2 gap-4">

                        {/* Left — status */}
                        <div className="flex items-center gap-2">
                            {c.icon}
                            <span className="text-xs font-bold tracking-wide">{c.label}</span>
                            {/* Auto-sync badge */}
                            {(bar === 'pending' || bar === 'clean') && (
                                <span className="ml-2 text-[10px] font-black uppercase tracking-widest opacity-75 bg-white/20 px-2 py-0.5 rounded-full">
                                    {autoSyncOn ? 'Auto-sync ON' : 'Manual Sync'}
                                </span>
                            )}
                        </div>

                        {/* Right — actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Sync progress bar */}
                            {bar === 'syncing' && syncProgress.total > 0 && (
                                <div className="w-28 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white rounded-full"
                                        animate={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            )}

                            {/* Sync Now button */}
                            {bar === 'pending' && isOnline && !isSyncing && (
                                <button
                                    onClick={handleSyncNow}
                                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <CloudUpload className="w-3.5 h-3.5" />
                                    Sync Now
                                </button>
                            )}

                            {/* Retry Failed button */}
                            {bar === 'failed' && isOnline && !isSyncing && (
                                <button
                                    onClick={handleRetryFailed}
                                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Retry Failed
                                </button>
                            )}

                            {/* Offline — pending count chip */}
                            {bar === 'offline' && pendingCount > 0 && (
                                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                    {pendingCount} queued
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Syncing progress bar (full-width) */}
                    {bar === 'syncing' && syncProgress.total > 0 && (
                        <div className="pb-1.5">
                            <div className="w-full h-0.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white/70 rounded-full"
                                    animate={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GlobalSyncBar;
