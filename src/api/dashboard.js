import apiClient from './client';

// Dashboard APIs
export const dashboardAPI = {
    getTodaySummary: (schoolId) => apiClient.get(`/dashboard/today-summary/${schoolId}`),
    getAbsentees: (schoolId) => apiClient.get(`/dashboard/absentees/${schoolId}`),
    getDropoutRisk: (schoolId) => apiClient.get(`/dashboard/dropout-risk/${schoolId}`),
    getStudentPercentage: (studentId, params) =>
        apiClient.get(`/dashboard/student-percentage/${studentId}`, { params }),
    getTrends: (schoolId, params) => apiClient.get(`/dashboard/trends/${schoolId}`, { params }),
    getClassComparison: (schoolId) => apiClient.get(`/dashboard/class-comparison/${schoolId}`),
    getStudentStats: (studentId) => apiClient.get(`/dashboard/student-stats/${studentId}`),
    getClasses: (schoolId) => apiClient.get(`/dashboard/classes/${schoolId}`),
    getSchoolPerformances: () => apiClient.get('/dashboard/school-performances'),
};

export default dashboardAPI;
