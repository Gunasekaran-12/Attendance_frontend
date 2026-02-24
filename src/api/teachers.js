import apiClient from './client';

export const teacherAPI = {
    getAll: () => apiClient.get('/teachers'),
    getById: (id) => apiClient.get(`/teachers/${id}`),
    getBySchool: (schoolId) => apiClient.get(`/teachers/school/${schoolId}`),
    create: (data) => apiClient.post('/teachers', data),
    update: (id, data) => apiClient.put(`/teachers/${id}`, data),
    delete: (id) => apiClient.delete(`/teachers/${id}`),
};

export default teacherAPI;
