/**
 * OfflineSyncStatus.jsx
 * ---------------------
 * A detailed widget showing pending records metric and sync storage limits.
 * Now consumes shared NetworkContext instead of managing window events.
 */
import React from 'react';
import { Database, AlertTriangle, CloudUpload, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { syncPendingAttendance } from '../../utils/offlineSync';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50MB
const BYTES_PER_RECORD = 300;

const OfflineSyncStatus = () => {
    const { isOnline, pendingCount, isSyncing, setIsSyncing, refreshCounts } = useNetwork();
    const toast = useToast();

    const usedBytes = pendingCount * BYTES_PER_RECORD;
    const sizeMb = (usedBytes / (1024 * 1024)).toFixed(2);
    const sizeKb = (usedBytes / 1024).toFixed(2);
    const usagePercent = Math.min(((usedBytes / MAX_STORAGE_BYTES) * 100), 100).toFixed(2);
    const isCritical = usagePercent > 80;
    const isAllSynced = isOnline && pendingCount === 0;

    const handleManualSync = async () => {
        if (!isOnline) {
            toast.error("Cannot sync offline. Waiting for network connection.", { icon: <WifiOff className="w-5 h-5" /> });
            return;
        }
        if (pendingCount === 0) {
            toast.info("Database is fully up to date.");
            return;
        }

        setIsSyncing(true);
        const toastId = toast.loading(`Manual Syncing ${pendingCount} records...`);
        try {
            await syncPendingAttendance();
            await refreshCounts();
            toast.dismiss(toastId);
            toast.success("Attendance successfully synced to cloud!", { icon: <CloudUpload className="w-5 h-5" /> });
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Cloud sync failed. Will retry automatically.", { icon: <AlertTriangle className="w-5 h-5" /> });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500 overflow-hidden relative ${
                    isCritical ? 'bg-orange-50 border-orange-200' :
                    isAllSynced ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100' :
                    isOnline ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' : 
                    'bg-slate-50 border-rose-200 shadow-rose-900/5'
                }`}
            >
                {/* Visual Storage Gauge (Background effect) */}
                <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
                        isCritical ? 'bg-orange-500' : 
                        usagePercent > 0 ? (isOnline ? 'bg-blue-400' : 'bg-rose-400') : 'bg-transparent'
                    }`}
                    style={{ width: `${Math.max(0.5, usagePercent)}%` }}
                />

                {/* Left Side: Status & Network Pulse */}
                <div className="flex items-start gap-4 w-full md:w-auto z-10">
                    <div className="relative">
                        <div className={`p-3.5 rounded-xl text-white shadow-md ${
                            isCritical ? 'bg-orange-500 shadow-orange-500/30' :
                            isAllSynced ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-teal-500/30' : 
                            isOnline ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30' : 
                            'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30'
                        }`}>
                            {isAllSynced ? <CloudUpload className="w-6 h-6" /> : 
                             isOnline ? <Wifi className="w-6 h-6" /> : 
                             <WifiOff className="w-6 h-6" />}
                        </div>
                        {/* Pulse effect when online with pending data */}
                        {isOnline && pendingCount > 0 && !isSyncing && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                            </span>
                        )}
                    </div>

                    <div>
                        <h3 className={`font-bold text-lg leading-tight flex items-center gap-2 ${
                            isCritical ? 'text-orange-900' :
                            isAllSynced ? 'text-teal-900' : 
                            isOnline ? 'text-indigo-900' : 
                            'text-rose-900'
                        }`}>
                            {isAllSynced ? 'Database Synchronized' : 
                             isOnline ? 'Network Connected' : 
                             'Operating Offline'}
                        </h3>
                        <p className="text-sm font-medium mt-1 text-slate-600 flex items-center gap-1.5">
                            {isAllSynced ? (
                                <span>All local data securely backed up to cloud.</span>
                            ) : isOnline ? (
                                <span>Ready to sync local data to server.</span>
                            ) : (
                                <>
                                    <Database className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Records are being saved locally via IndexedDB.</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Right Side: Storage Metrics */}
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto z-10 bg-white/60 p-3 rounded-xl border border-white backdrop-blur-sm">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Records</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <HardDrive className="w-4 h-4 text-slate-400" /> 
                                {pendingCount}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Storage Used</span>
                            <span className={`font-bold flex items-center gap-1.5 ${isCritical ? 'text-orange-600' : 'text-slate-800'}`}>
                                <Database className={`w-4 h-4 ${isCritical ? 'text-orange-500' : 'text-slate-400'}`} /> 
                                {parseFloat(sizeMb) > 1 ? `${sizeMb} MB` : `${sizeKb} KB`}
                            </span>
                        </div>
                        {/* Progress Bar for Storage Limit */}
                        {pendingCount > 0 && (
                            <div className="col-span-2 mt-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                    <span>{usagePercent}% of 50MB</span>
                                    {isCritical && <span className="text-orange-500 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Critical</span>}
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${isCritical ? 'bg-orange-500' : 'bg-indigo-500'}`} 
                                        style={{ width: `${Math.max(2, usagePercent)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sync Action */}
                    {(pendingCount > 0) && (
                        <button
                            onClick={handleManualSync}
                            disabled={isSyncing || !isOnline}
                            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${
                                !isOnline ? 'bg-slate-200 text-slate-400 cursor-not-allowed' :
                                'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 active:scale-95'
                            }`}
                        >
                            {isSyncing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <CloudUpload className="w-4 h-4" />
                                    <span>{isOnline ? 'Sync Now' : 'Sync Pending'}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OfflineSyncStatus;
