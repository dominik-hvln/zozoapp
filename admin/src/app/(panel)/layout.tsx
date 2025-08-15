'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PanelLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    const { user, token } = useAuthStore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            if (!token) {
                router.push('/login');
            } else if (user?.role !== 'ADMIN') {
                useAuthStore.getState().logout();
                router.push('/login');
                toast.error('Brak uprawnień administratora.');
            }
        }
    }, [user, token, isClient, router]);

    if (!isClient || !token || user?.role !== 'ADMIN') {
        return (
            <div className="flex h-screen items-center justify-center">
                Sprawdzanie uprawnień...
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}