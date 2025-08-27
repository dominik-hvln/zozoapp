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
    initializeAuth: () => Promise<void>; // Nowa funkcja do wczytywania tokena
    setToken: (token: string) => void;
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
    },

    // --- ZAKTUALIZOWANA FUNKCJA ---
    logout: async () => {
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