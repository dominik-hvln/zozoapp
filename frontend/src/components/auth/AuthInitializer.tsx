'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export function AuthInitializer() {
    const { initializeAuth, refreshToken, token } = useAuthStore();

    useEffect(() => {
        initializeAuth();
        if (Capacitor.isNativePlatform()) {
            let listenerHandle: { remove: () => void } | null = null;

            const setupListener = async () => {
                listenerHandle = await App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive && token) {
                        refreshToken();
                    }
                });
            };

            setupListener();

            return () => {
                if (listenerHandle) {
                    listenerHandle.remove();
                }
            };
        }
    }, [initializeAuth, refreshToken, token]);

    return null;
}
