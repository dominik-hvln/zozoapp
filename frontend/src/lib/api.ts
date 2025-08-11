import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export const api = axios.create({
    baseURL: 'http://localhost:3001',
});

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