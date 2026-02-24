import apiClient from './client';

export const studentRequestAPI = {
    getPending: (schoolId) => apiClient.get(`/student-requests/pending/${schoolId}`),
    approve: (requestId, userId) => apiClient.post(`/student-requests/${requestId}/approve`, { userId }),
    reject: (requestId, userId) => apiClient.post(`/student-requests/${requestId}/reject`, { userId }),
    approveAll: (schoolId, userId) => apiClient.post(`/student-requests/approve-all/${schoolId}`, { userId }),
    rejectAll: (schoolId, userId) => apiClient.post(`/student-requests/reject-all/${schoolId}`, { userId }),
};

export default studentRequestAPI;
