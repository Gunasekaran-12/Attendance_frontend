import apiClient from './client';

const profileAPI = {
    getStudentProfile: (id) => apiClient.get(`/profiles/student/${id}`),
    getTeacherProfile: (id) => apiClient.get(`/profiles/teacher/${id}`),
    getSchoolProfile: (id) => apiClient.get(`/profiles/school/${id}`),
    getAdminProfile: (id) => apiClient.get(`/profiles/admin/${id}`),
};

export default profileAPI;
