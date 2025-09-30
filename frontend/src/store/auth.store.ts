import { create } from 'zustand';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface UserPayload {
    sub: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    status: 'TRIAL' | 'ACTIVE' | 'BLOCKED';
    firstName: string | null;
    avatar_url: string | null;
}

interface AuthState {
    token: string | null;
    user: UserPayload | null;
    isInitialized: boolean;
    refreshInterval: NodeJS.Timeout | null;
    initializeAuth: () => Promise<void>;
    setToken: (token: string) => void;
    refreshToken: () => Promise<void>;
    startTokenRefreshInterval: () => void;
    clearTokenRefreshInterval: () => void;
    logout: () => void;
}

const decodeToken = (token: string): UserPayload | null => {
    try {
        return jwtDecode<UserPayload>(token);
    } catch {
        return null;
    }
};

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    user: null,
    isInitialized: false,
    refreshInterval: null,
    initializeAuth: async () => {
        if (get().isInitialized) return;

        let token: string | null = null;

        if (Capacitor.isNativePlatform()) {
            const { value } = await Preferences.get({ key: 'authToken' });
            token = value;
        } else {
            token = Cookies.get('access_token') || null;
        }

        if (token) {
            const user = decodeToken(token);
            if (user) {
                set({ token, user, isInitialized: true });
                get().startTokenRefreshInterval();
            } else {
                get().logout();
                set({ isInitialized: true });
            }
        } else {
            set({ isInitialized: true });
        }
    },

    setToken: async (token: string) => {
        if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key: 'authToken', value: token });
        } else {
            const isProduction = process.env.NODE_ENV === 'production';
            Cookies.set('access_token', token, { expires: 30, secure: isProduction });
        }

        const user = decodeToken(token);
        set({ token, user });
        get().startTokenRefreshInterval();

        if (Capacitor.isNativePlatform()) {
            try {
                const { initializePushNotifications } = await import('@/lib/push-notifications.service');
                await initializePushNotifications();
            } catch (error) {
                console.error('[AUTH] Błąd podczas inicjalizacji powiadomień push:', error);
            }
        }
    },

    refreshToken: async () => {
        const currentToken = get().token;
        if (!currentToken) return;

        try {
            const { api } = await import('@/lib/api');
            const response = await api.post('/auth/refresh');
            const { access_token } = response.data;

            if (Capacitor.isNativePlatform()) {
                await Preferences.set({ key: 'authToken', value: access_token });
            } else {
                const isProduction = process.env.NODE_ENV === 'production';
                Cookies.set('access_token', access_token, { expires: 30, secure: isProduction });
            }

            const user = decodeToken(access_token);
            set({ token: access_token, user });

        } catch (error) {
            console.error('[AUTH] Błąd podczas odświeżania tokena:', error);
            get().logout();
        }
    },

    startTokenRefreshInterval: () => {
        get().clearTokenRefreshInterval();
        const interval = setInterval(() => {
            get().refreshToken();
        }, 23 * 60 * 60 * 1000);

        set({ refreshInterval: interval });
    },

    clearTokenRefreshInterval: () => {
        const currentInterval = get().refreshInterval;
        if (currentInterval) {
            clearInterval(currentInterval);
            set({ refreshInterval: null });
        }
    },

    logout: async () => {
        get().clearTokenRefreshInterval();

        if (Capacitor.isNativePlatform()) {
            await Preferences.remove({ key: 'authToken' });
        } else {
            Cookies.remove('access_token');
        }
        set({ token: null, user: null });
    },
}));