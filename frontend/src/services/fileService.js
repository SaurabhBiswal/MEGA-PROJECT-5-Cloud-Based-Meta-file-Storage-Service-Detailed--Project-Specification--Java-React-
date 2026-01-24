import api from './api';

const fileService = {
    getMyFiles: async (folderId = null) => {
        const url = folderId ? `/files/list/${folderId}` : '/files/list';
        const response = await api.get(url);
        return response.data;
    },

    uploadFile: async (file, folderId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) {
            formData.append('folderId', folderId);
        }

        // Note: Assuming backend handles multipart/form-data directly
        // Or if using presigned URLs, this would be different.
        // For this MVP, let's assume direct upload or the init-upload flow mentioned in spec.

        // If using the init-upload flow:
        // 1. Init upload -> get presigned URL
        // 2. Upload to S3/Supabase
        // 3. Complete upload -> notify backend

        // For now, let's stick to a simple multipart upload assumption for the service skeleton,
        // but the backend spec mentioned Init/Complete. Let's align with that if needed later.
        // For now, standard multipart to backend for simplicity if supported, or logic to handle the flow.
        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    downloadFile: async (id) => {
        const response = await api.get(`/files/${id}/download`, {
            responseType: 'blob'
        });
        return response;
    },

    deleteFile: async (id) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    },

    renameFile: async (id, newName) => {
        const response = await api.put(`/files/${id}/rename`, null, {
            params: { newName }
        });
        return response.data;
    },

    starFile: async (id) => {
        const response = await api.post(`/files/${id}/star`);
        return response.data;
    },

    getStarredFiles: async () => {
        const response = await api.get('/files/starred');
        return response.data;
    },

    getTrashedFiles: async () => {
        const response = await api.get('/files/trash-items');
        return response.data;
    },

    restoreFile: async (id) => {
        const response = await api.post(`/files/${id}/restore`);
        return response.data;
    },

    permanentDeleteFile: async (id) => {
        const response = await api.delete(`/files/${id}/permanent`);
        return response.data;
    },

    searchFiles: async (query) => {
        const response = await api.get('/files/search', {
            params: { query }
        });
        return response.data;
    },

    generatePublicLink: async (id) => {
        const response = await api.post(`/files/${id}/public-link`);
        return response.data;
    },

    moveFile: async (id, folderId) => {
        const response = await api.put(`/files/${id}/move`, null, {
            params: { folderId }
        });
        return response.data;
    },

    getPublicFile: async (token) => {
        const response = await api.get(`/files/public/${token}`);
        return response.data;
    },

    getDownloadUrl: (id) => {
        const token = localStorage.getItem('token');
        return `http://localhost:8080/api/files/${id}/download?token=${token}`;
    },

    getPublicDownloadUrl: (token) => {
        return `http://localhost:8080/api/files/public/download/${token}`;
    }
};

export default fileService;
