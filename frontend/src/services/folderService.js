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
    },

    deleteFolder: async (id) => {
        const response = await api.delete(`/folders/${id}`);
        return response.data;
    },

    renameFolder: async (id, newName) => {
        const response = await api.put(`/folders/${id}/rename`, null, {
            params: { newName }
        });
        return response.data;
    },

    moveFolder: async (folderId, targetFolderId) => {
        const response = await api.put(`/folders/${folderId}/move`, null, {
            params: { targetFolderId }
        });
        return response.data;
    }
};

export default folderService;
