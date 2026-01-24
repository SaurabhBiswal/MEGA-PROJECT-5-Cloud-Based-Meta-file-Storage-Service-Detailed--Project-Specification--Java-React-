import api from './api';

const notificationService = {
    getNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },
    markAsRead: async (id) => {
        await api.put(`/notifications/${id}/read`);
    }
};

export default notificationService;
