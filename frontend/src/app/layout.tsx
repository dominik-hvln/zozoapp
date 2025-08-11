import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ZozoApp',
    description: 'Bezpieczne tatuaże dla Twojego dziecka',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pl">
        <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster richColors />
        </body>
        </html>
    );
}