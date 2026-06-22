import apiClient from './client';

// Geography APIs
export const geographyAPI = {
    // States
    getStates: () => apiClient.get('/geography/states'),
    createState: (data) => apiClient.post('/geography/states', data),

    // Districts
    getDistricts: () => apiClient.get('/geography/districts'),
    getDistrictsByState: (stateId) => apiClient.get(`/geography/states/${stateId}/districts`),
    createDistrict: (data) => apiClient.post('/geography/districts', data),

    // Blocks
    getBlocks: () => apiClient.get('/geography/blocks'),
    getBlocksByDistrict: (districtId) => apiClient.get(`/geography/districts/${districtId}/blocks`),
    createBlock: (data) => apiClient.post('/geography/blocks', data),

    // Regions
    getRegions: () => apiClient.get('/geography/regions'),
    getRegionsByBlock: (blockId) => apiClient.get(`/geography/blocks/${blockId}/regions`),
    createRegion: (data) => apiClient.post('/geography/regions', data),

    // Hierarchy
    getHierarchy: () => apiClient.get('/geography/hierarchy'),
    getSchools: () => apiClient.get('schools'),
    createSchool: (data) => apiClient.post('/schools', data),
    updateSchool: (id, data) => apiClient.put(`/schools/${id}`, data),
    deleteSchool: (id) => apiClient.delete(`/schools/${id}`),
};

export default geographyAPI;
