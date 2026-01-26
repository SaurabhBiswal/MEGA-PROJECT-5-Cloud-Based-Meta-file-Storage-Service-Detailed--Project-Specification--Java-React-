import api from './api';

const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data)); // Optional: store user info if needed
        }
        return response.data;
    },

    register: async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        return response.data;
    },

    logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser: () => {
        return JSON.parse(sessionStorage.getItem('user'));
    },

    isAuthenticated: () => {
        return !!sessionStorage.getItem('token');
    }
};

export default authService;
