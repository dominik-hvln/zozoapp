import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const api = axios.create({
    // Ten kod dynamicznie wybierze adres URL
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Interceptor dołączający token (pozostaje bez zmian)
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);