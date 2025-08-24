import { create } from 'zustand';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

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
    setToken: (token: string) => void;
    logout: () => void;
}

// Funkcja pomocnicza do odczytu tokenu i ciasteczka
const getTokenData = () => {
    const token = Cookies.get('access_token');
    if (token) {
        try {
            const user = jwtDecode<UserPayload>(token);
            return { token, user };
        } catch {
            return { token: null, user: null };
        }
    }
    return { token: null, user: null };
}

export const useAuthStore = create<AuthState>((set) => ({
    ...getTokenData(),

    setToken: (token) => {
        const isProduction = process.env.NODE_ENV === 'production';
        Cookies.set('access_token', token, { expires: 1, secure: isProduction });
        const user = jwtDecode<UserPayload>(token);
        set({ token, user });
    },

    logout: () => {
        Cookies.remove('access_token');
        set({ token: null, user: null });
    },
}));