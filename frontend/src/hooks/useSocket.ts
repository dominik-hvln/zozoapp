'use client';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export const useSocket = () => {
    const { user, setToken } = useAuthStore();

    useEffect(() => {
        if (user) {
            // Dołącz do swojego prywatnego "pokoju" na serwerze
            socket.emit('joinRoom', user.sub);

            socket.on('accountStatusChanged', (data) => {
                console.log('Otrzymano aktualizację statusu:', data);
                api.post('/auth/refresh').then(response => {
                    setToken(response.data.access_token);
                    toast.success('Twoja subskrypcja została aktywowana!');
                });
            });
        }

        return () => {
            if (user) {
                socket.emit('leaveRoom', user.sub);
                socket.off('accountStatusChanged');
            }
        };
    }, [user, setToken]);
};