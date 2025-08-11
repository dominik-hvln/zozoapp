'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const { token } = useAuthStore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false); // Nowy stan

    useEffect(() => {
        setIsClient(true); // Ustawiamy, że jesteśmy po stronie klienta
    }, []);

    useEffect(() => {
        // Tę logikę wykonujemy tylko po stronie klienta
        if (isClient && !token) {
            router.push('/login');
        }
    }, [token, router, isClient]);

    // Dopóki nie jesteśmy pewni, że to klient, nic nie renderujemy,
    // aby uniknąć niezgodności z serwerem.
    if (!isClient || !token) {
        return (
            <div className="flex h-screen items-center justify-center">
                Sprawdzanie autoryzacji...
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
    );
}