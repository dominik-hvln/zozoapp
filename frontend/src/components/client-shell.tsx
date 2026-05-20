'use client';

import { Inter } from 'next/font/google';
import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

const inter = Inter({ subsets: ['latin'] });

export function ClientShell({
    children,
    initialReviewMode,
}: {
    children: React.ReactNode;
    initialReviewMode: boolean;
}) {
    return (
        <body className={`${inter.className} antialiased`}>
            <Providers initialReviewMode={initialReviewMode}>
                <AuthInitializer />
                {children}
                <Toaster />
            </Providers>
        </body>
    );
}
