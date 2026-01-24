import api from './api';

const shareService = {
    // Share file with a user
    shareFile: async (fileId, email, permission) => {
        const response = await api.post('/shares', {
            fileId,
            email,
            permission // "VIEWER" or "EDITOR"
        });
        return response.data;
    },

    // Get shares for a specific file
    getFileShares: async (fileId) => {
        const response = await api.get(`/shares/file/${fileId}`);
        return response.data;
    },

    // Revoke a share
    revokeShare: async (shareId) => {
        const response = await api.delete(`/shares/${shareId}`);
        return response.data;
    },

    // Get files shared with me
    getSharedWithMe: async () => {
        const response = await api.get('/shares/shared-with-me');
        return response.data;
    },

    // Get files I've shared
    getSharedByMe: async () => {
        const response = await api.get('/shares/shared-by-me');
        return response.data;
    }
};

export default shareService;
