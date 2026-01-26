import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (e.g. check token)
        const token = sessionStorage.getItem('token');
        if (token) {
            // Ideally verify token with backend here
            // For now, just assume logged in or decode token if needed
            setUser({ email: 'Logged User' });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        sessionStorage.setItem('token', response.data.token);
        setUser(response.data.user || { email });
        return response.data;
    };

    const loginWithToken = (token) => {
        sessionStorage.setItem('token', token);
        // We could decode JWT here, but for now we just set a generic user to trigger auth state
        setUser({ email: 'Google User' });
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loginWithToken, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
