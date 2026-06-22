import apiClient from './client';

// Report download APIs
export const reportAPI = {
    downloadPdf: (schoolId, params) =>
        apiClient.get(`/reports/pdf/${schoolId}`, {
            params,
            responseType: 'blob',
        }),

    downloadExcel: (schoolId, params) =>
        apiClient.get(`/reports/excel/${schoolId}`, {
            params,
            responseType: 'blob',
        }),
};

export default reportAPI;
