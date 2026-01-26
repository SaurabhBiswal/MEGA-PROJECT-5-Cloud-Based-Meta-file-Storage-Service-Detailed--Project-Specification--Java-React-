import api from './api';

const fileService = {
    getMyFiles: async (folderId = null) => {
        const url = folderId ? `/files/list/${folderId}` : '/files/list';
        const response = await api.get(url);
        return response.data;
    },

    uploadFile: async (file, folderId = null, onProgress = null, signal = null) => {
        const formData = new FormData();
        formData.append('file', file);
        // Only append folderId if it's a valid non-null value to avoid Spring 400 conversion error
        if (folderId && folderId !== 'null' && folderId !== 'undefined') {
            formData.append('folderId', folderId);
        }

        const response = await api.post('/files/upload', formData, {
            signal, // AbortController signal
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
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

    getRecentFiles: async () => {
        const response = await api.get('/files/recent');
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
        const token = sessionStorage.getItem('token');
        if (!token || token === 'null') {
            alert("Session lost. Please re-login.");
            window.location.href = '/login';
            return '';
        }
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        return `${baseUrl}/files/${id}/download?token=${token}`;
    },

    getPublicDownloadUrl: (token) => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        return `${baseUrl}/files/public/download/${token}`;
    }
};

export default fileService;
