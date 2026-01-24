import api from './api';

const folderService = {
    getRootFolders: async () => {
        const response = await api.get('/folders/root');
        return response.data;
    },

    getSubfolders: async (id) => {
        const response = await api.get(`/folders/${id}/subfolders`);
        return response.data;
    },

    getFolder: async (id) => {
        const response = await api.get(`/folders/${id}`);
        return response.data;
    },

    createFolder: async (name, parentFolderId = null) => {
        const response = await api.post('/folders', { name, parentFolderId });
        return response.data;
    }
};

export default folderService;
