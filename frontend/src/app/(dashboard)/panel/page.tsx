'use client';
import { useAuthStore } from '@/store/auth.store';

export default function PanelPage() {
    const { logout } = useAuthStore();

    return (
        <div>
            <h1 className="text-3xl font-bold">Witaj w Panelu Głównym!</h1>
            <p className="mt-4">To jest Twoje centrum dowodzenia.</p>
            {/* Przycisk wylogowania może być później przeniesiony do nagłówka */}
            <button
                onClick={logout}
                className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Wyloguj się
            </button>
        </div>
    );
}