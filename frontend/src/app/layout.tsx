import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ClientShell } from '@/components/client-shell';
import { isAppStoreReviewModeServer } from '@/lib/app-review-server';

export const metadata: Metadata = {
    title: 'ZozoApp',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pl">
            <ClientShell initialReviewMode={isAppStoreReviewModeServer()}>
                {children}
            </ClientShell>
        </html>
    );
}
