import apiClient from './client';

// Authentication APIs
export const authAPI = {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    submitStudentRequest: (requestData) => apiClient.post('/student-requests/submit', requestData),
};

export default authAPI;
