/**
 * syncLogger.js
 * -------------
 * Structured sync event logger persisted to IndexedDB via localforage.
 * Stores the last 200 sync events and exposes query helpers.
 *
 * Logged events:
 *   SYNC_STARTED | SYNC_SUCCESS | SYNC_PARTIAL | SYNC_FAILED
 *   RECORD_SAVED_LOCALLY | RECORD_SYNCED | RECORD_FAILED
 *   NETWORK_ONLINE | NETWORK_OFFLINE | NETWORK_UNSTABLE
 *   CONFLICT_DETECTED | CONSENT_SHOWN | AUTO_SYNC_ENABLED
 */
import localforage from 'localforage';

const SYNC_LOG_KEY = 'sync_event_log';
const MAX_LOG_ENTRIES = 200;

const logStore = localforage.createInstance({
    name: 'AttendanceSystem',
    storeName: 'sync_logs',
    description: 'Structured sync event log'
});

/**
 * Log a sync event.
 * @param {string} event - Event type constant
 * @param {object} [meta] - Optional metadata (count, error, recordId, etc.)
 */
export const logSyncEvent = async (event, meta = {}) => {
    try {
        const logs = await logStore.getItem(SYNC_LOG_KEY) || [];
        const entry = {
            id: crypto.randomUUID(),
            event,
            timestamp: new Date().toISOString(),
            ...meta,
        };
        const updated = [entry, ...logs].slice(0, MAX_LOG_ENTRIES);
        await logStore.setItem(SYNC_LOG_KEY, updated);
    } catch (err) {
        console.warn('[SyncLogger] Failed to write log:', err);
    }
};

/** Retrieve all stored sync logs (newest first). */
export const getSyncLogs = async () => {
    try {
        return await logStore.getItem(SYNC_LOG_KEY) || [];
    } catch {
        return [];
    }
};

/** Retrieve only error/failure logs. */
export const getFailureLogs = async () => {
    const logs = await getSyncLogs();
    return logs.filter(l => ['SYNC_FAILED', 'SYNC_PARTIAL', 'RECORD_FAILED'].includes(l.event));
};

/** Clear all sync logs. */
export const clearSyncLogs = async () => {
    await logStore.removeItem(SYNC_LOG_KEY);
};

// Named event constants for consistent usage across the codebase
export const SYNC_EVENTS = {
    SYNC_STARTED: 'SYNC_STARTED',
    SYNC_SUCCESS: 'SYNC_SUCCESS',
    SYNC_PARTIAL: 'SYNC_PARTIAL',
    SYNC_FAILED: 'SYNC_FAILED',
    RECORD_SAVED_LOCALLY: 'RECORD_SAVED_LOCALLY',
    RECORD_SYNCED: 'RECORD_SYNCED',
    RECORD_FAILED: 'RECORD_FAILED',
    NETWORK_ONLINE: 'NETWORK_ONLINE',
    NETWORK_OFFLINE: 'NETWORK_OFFLINE',
    NETWORK_UNSTABLE: 'NETWORK_UNSTABLE',
    CONFLICT_DETECTED: 'CONFLICT_DETECTED',
    CONSENT_SHOWN: 'CONSENT_SHOWN',
    AUTO_SYNC_ENABLED: 'AUTO_SYNC_ENABLED',
    RETRY_STARTED: 'RETRY_STARTED',
};
