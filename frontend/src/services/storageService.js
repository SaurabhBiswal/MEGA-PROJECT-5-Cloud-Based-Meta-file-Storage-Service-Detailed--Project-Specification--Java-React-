import api from './api';

const storageService = {
    getUsage: async () => {
        const response = await api.get('/storage/usage');
        return response.data;
    },
    getBreakdown: async () => {
        const response = await api.get('/storage/breakdown');
        return response.data;
    },
    deleteFile: async (id) => {
        const response = await api.delete(`/files/${id}/permanent`);
        return response.data;
    }
};

export default storageService;
