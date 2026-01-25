import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const GoogleLoginButton = () => {
    const { loginWithToken } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // credentialResponse.credential is the ID Token we need for the backend verifier
            const response = await api.post('/auth/google', {
                idToken: credentialResponse.credential
            });

            if (response.data.token) {
                loginWithToken(response.data.token);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            alert('Google authentication failed. Please check if your account is in the test users list.');
        }
    };

    return (
        <div className="w-full flex justify-center">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Login Failed')}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                width="100%"
            />
        </div>
    );
};

export default GoogleLoginButton;
