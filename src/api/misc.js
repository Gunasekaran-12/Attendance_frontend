import apiClient from './client';

// Session APIs
export const sessionAPI = {
    getActiveSessions: (userId) => apiClient.get(`/sessions/active/${userId}`),
    getAllSessions: (userId) => apiClient.get(`/sessions/all/${userId}`),
    endSession: (data) => apiClient.post('/sessions/end', data),
};

// Sync APIs
export const syncAPI = {
    queueForSync: (data) => apiClient.post('/sync/queue', data),
    processSync: () => apiClient.post('/sync/process'),
    getPendingCount: (deviceId) => apiClient.get(`/sync/pending/${deviceId}`),
    getStatus: (deviceId) => apiClient.get(`/sync/status/${deviceId}`),
};

// Audit APIs
export const auditAPI = {
    getByUser: (userId) => apiClient.get(`/audit/user/${userId}`),
    getByAction: (action) => apiClient.get(`/audit/action/${action}`),
    getByEntity: (entityType, entityId) =>
        apiClient.get(`/audit/entity/${entityType}/${entityId}`),
    getAll: () => apiClient.get('/audit/all'),
};
