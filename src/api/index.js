// Export all API services
export { default as apiClient } from './client';
export { default as authAPI } from './auth';
export { default as dashboardAPI } from './dashboard';
export { default as attendanceAPI } from './attendance';
export { default as geographyAPI } from './geography';
export { default as teacherAPI } from './teachers';
export { studentAPI, transferAPI, guardianAPI } from './students';
export { default as studentRequestAPI } from './studentRequests';
export { default as profileAPI } from './profile';
export { default as reportAPI } from './reports';
export { sessionAPI, syncAPI, auditAPI } from './misc';
