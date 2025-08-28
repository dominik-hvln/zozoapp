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
    isInitialized: boolean; // Nowy stan do śledzenia inicjalizacji
    refreshInterval: NodeJS.Timeout | null;
    initializeAuth: () => Promise<void>; // Nowa funkcja do wczytywania tokena
    setToken: (token: string) => void;
    refreshToken: () => Promise<void>; // Nowa funkcja do odświeżania tokena
    startTokenRefreshInterval: () => void; // Automatyczne odświeżanie
    clearTokenRefreshInterval: () => void;
    logout: () => void;
}

// Funkcja pomocnicza do dekodowania tokena
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

    // --- NOWA FUNKCJA DO INICJALIZACJI ---
    // Ta funkcja będzie wywoływana przy starcie aplikacji, aby wczytać token.
    initializeAuth: async () => {
        if (get().isInitialized) return;

        let token: string | null = null;

        if (Capacitor.isNativePlatform()) {
            // Aplikacja mobilna: wczytaj z trwałej pamięci
            const { value } = await Preferences.get({ key: 'authToken' });
            token = value;
        } else {
            // Wersja webowa: wczytaj z ciasteczek
            token = Cookies.get('access_token') || null;
        }

        if (token) {
            const user = decodeToken(token);
            if (user) {
                set({ token, user, isInitialized: true });
                // Uruchom automatyczne odświeżanie tokena po wczytaniu z pamięci
                get().startTokenRefreshInterval();
            } else {
                // Jeśli token jest nieprawidłowy, czyścimy go
                get().logout();
                set({ isInitialized: true });
            }
        } else {
            set({ isInitialized: true });
        }
    },

    // --- ZAKTUALIZOWANA FUNKCJA ---
    setToken: async (token: string) => {
        if (Capacitor.isNativePlatform()) {
            // Aplikacja mobilna: zapisz w trwałej pamięci
            await Preferences.set({ key: 'authToken', value: token });
        } else {
            // Wersja webowa: zapisz w ciasteczkach
            const isProduction = process.env.NODE_ENV === 'production';
            Cookies.set('access_token', token, { expires: 30, secure: isProduction });
        }

        const user = decodeToken(token);
        set({ token, user });

        // Uruchom automatyczne odświeżanie tokena
        get().startTokenRefreshInterval();

        // Inicjalizuj powiadomienia push po zalogowaniu (tylko na urządzeniach mobilnych)
        if (Capacitor.isNativePlatform()) {
            console.log('[AUTH] Inicjalizacja powiadomień push po zalogowaniu...');
            try {
                const { initializePushNotifications } = await import('@/lib/push-notifications.service');
                await initializePushNotifications();
            } catch (error) {
                console.error('[AUTH] Błąd podczas inicjalizacji powiadomień push:', error);
            }
        }
    },

    // --- NOWA FUNKCJA DO ODŚWIEŻANIA TOKENA ---
    refreshToken: async () => {
        const currentToken = get().token;
        if (!currentToken) return;

        try {
            const { api } = await import('@/lib/api');
            const response = await api.post('/auth/refresh');
            const { access_token } = response.data;

            // Zapisz nowy token bez uruchamiania ponownie intervalu
            if (Capacitor.isNativePlatform()) {
                await Preferences.set({ key: 'authToken', value: access_token });
            } else {
                const isProduction = process.env.NODE_ENV === 'production';
                Cookies.set('access_token', access_token, { expires: 30, secure: isProduction });
            }

            const user = decodeToken(access_token);
            set({ token: access_token, user });

            console.log('[AUTH] Token został odświeżony automatycznie');
        } catch (error) {
            console.error('[AUTH] Błąd podczas odświeżania tokena:', error);
            // Jeśli nie można odświeżyć tokena, wyloguj użytkownika
            get().logout();
        }
    },

    // --- NOWA FUNKCJA DO URUCHAMIANIA AUTOMATYCZNEGO ODŚWIEŻANIA ---
    startTokenRefreshInterval: () => {
        // Wyczyść poprzedni interval jeśli istnieje
        get().clearTokenRefreshInterval();

        // Ustaw nowy interval - odświeżaj token co 23 godziny (83% z 24h)
        const interval = setInterval(() => {
            get().refreshToken();
        }, 23 * 60 * 60 * 1000); // 23 godziny w milisekundach

        set({ refreshInterval: interval });
        console.log('[AUTH] Automatyczne odświeżanie tokena zostało uruchomione');
    },

    // --- NOWA FUNKCJA DO CZYSZCZENIA INTERVALU ---
    clearTokenRefreshInterval: () => {
        const currentInterval = get().refreshInterval;
        if (currentInterval) {
            clearInterval(currentInterval);
            set({ refreshInterval: null });
        }
    },

    // --- ZAKTUALIZOWANA FUNKCJA ---
    logout: async () => {
        // Zatrzymaj automatyczne odświeżanie tokena
        get().clearTokenRefreshInterval();

        if (Capacitor.isNativePlatform()) {
            // Aplikacja mobilna: usuń z trwałej pamięci
            await Preferences.remove({ key: 'authToken' });
        } else {
            // Wersja webowa: usuń z ciasteczek
            Cookies.remove('access_token');
        }
        set({ token: null, user: null });
    },
}));