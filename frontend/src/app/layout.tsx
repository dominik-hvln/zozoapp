'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { Toaster } from "@/components/ui/sonner"
import "leaflet/dist/leaflet.css";
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const { initializeAuth } = useAuthStore();

    useEffect(() => {
        // Inicjalizuj auth przy starcie aplikacji (web + mobile)
        initializeAuth();
    }, [initializeAuth]);

    return (
        <html lang="pl">
        <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster richColors />
        </body>
        </html>
    );
}