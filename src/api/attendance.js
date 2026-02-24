import apiClient from './client';

// Attendance APIs
export const attendanceAPI = {
    // Standard attendance marking
    markAttendance: (data) => apiClient.post('/attendance', data),
    markBulk: (data) => apiClient.post('/attendance/sync', data),

    // Different marking methods
    markRFID: (data, deviceId) => apiClient.post('/attendance/rfid/scan', data, {
        headers: { 'X-Device-ID': deviceId }
    }),
    markBiometric: (data, deviceId) => apiClient.post('/attendance/biometric/fingerprint', data, {
        headers: { 'X-Device-ID': deviceId }
    }),
    markQR: (data, deviceId) => apiClient.post('/attendance/qr/scan', data, {
        headers: { 'X-Device-ID': deviceId }
    }),
    markMobile: (data, deviceId) => apiClient.post('/attendance/mobile/checkin', data, {
        headers: { 'X-Device-ID': deviceId }
    }),

    // Attendance queries
    getByStudent: (studentId) => apiClient.get(`/attendance/student/${studentId}`),
    getBySchool: (schoolId) => apiClient.get(`/attendance/school/${schoolId}`),
    getByDate: (date) => apiClient.get(`/attendance/date/${date}`),

    // Attendance corrections
    requestCorrection: (data) => apiClient.post('/attendance/corrections/request', data),
    approveCorrection: (correctionId, data) =>
        apiClient.post(`/attendance/corrections/approve/${correctionId}`, data),
    rejectCorrection: (correctionId) =>
        apiClient.post(`/attendance/corrections/reject/${correctionId}`),
    getPendingCorrections: () => apiClient.get('/attendance/corrections/pending'),

    // Attendance locking
    lockAttendance: (attendanceId, data) => apiClient.post(`/attendance/lock/${attendanceId}`, data),
    unlockAttendance: (attendanceId, data) =>
        apiClient.post(`/attendance/lock/unlock/${attendanceId}`, data),
    autoLockOld: (schoolId, daysOld) =>
        apiClient.post(`/attendance/lock/auto-lock/${schoolId}`, null, { params: { daysOld } }),
};

export default attendanceAPI;
