'use client';

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import "leaflet/dist/leaflet.css";
import { AuthInitializer } from '@/components/auth/AuthInitializer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {

    return (
        <html lang="pl">
        <body className={`${inter.className} antialiased`}>
        <Providers>
            <AuthInitializer />
            {children}
            <Toaster />
        </Providers>
        </body>
        </html>
    );
}