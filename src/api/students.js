import apiClient from './client';

export const studentAPI = {
    getAll: () => apiClient.get('/students'),
    getById: (id) => apiClient.get(`/students/${id}`),
    getBySchool: (schoolId) => apiClient.get(`/students/school/${schoolId}`),
    create: (data) => apiClient.post('/students', data),
    update: (id, data) => apiClient.put(`/students/${id}`, data),
    delete: (id) => apiClient.delete(`/students/${id}`),
};

export const transferAPI = {
    initiate: (data) => apiClient.post('/transfers/initiate', data),
    approve: (id, data) => apiClient.post(`/transfers/approve/${id}`, data),
    reject: (id) => apiClient.post(`/transfers/reject/${id}`),
    getPending: () => apiClient.get('/transfers/pending'),
};

export const guardianAPI = {
    getByStudent: (studentId) => apiClient.get(`/guardians/student/${studentId}`),
    create: (data) => apiClient.post('/guardians', data),
    update: (id, data) => apiClient.put(`/guardians/${id}`, data),
};
