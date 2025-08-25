'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
    const { token, user, setToken } = useAuthStore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const queryClient = useQueryClient();

    useSocket();

    useEffect(() => { setIsClient(true); }, []);

    // Nasłuchiwanie na powrót do aplikacji (dla płatności mobilnych)
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            App.addListener('appUrlOpen', () => {
                Browser.close();
                toast.info('Przetwarzanie płatności...');
                api.post('/auth/refresh').then(response => {
                    setToken(response.data.access_token);
                    queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
                    toast.success('Płatność zakończona pomyślnie!');
                });
            });
        }
        return () => {
            if (Capacitor.isNativePlatform()) {
                App.removeAllListeners();
            }
        };
    }, [queryClient, setToken]);

    useEffect(() => {
        if (isClient && !token) {
            router.push('/login');
        }
    }, [token, router, isClient]);

    const checkoutMutation = useMutation({
        // OSTATECZNA POPRAWKA: Wysyłamy informację o platformie
        mutationFn: () => {
            const platform = Capacitor.isNativePlatform() ? 'mobile' : 'web';
            return api.post('/store/checkout/subscription', { platform });
        },
        onSuccess: async (response) => {
            const { url } = response.data;
            if (Capacitor.isNativePlatform()) {
                await Browser.open({ url });
            } else {
                window.location.href = url;
            }
        },
        onError: () => toast.error('Nie udało się rozpocząć procesu płatności.'),
    });

    if (!isClient || !token) {
        return <div className="flex h-screen items-center justify-center">Sprawdzanie autoryzacji...</div>;
    }

    const isAccountBlocked = user?.status === 'BLOCKED';

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 lg:p-8 relative">
                {isAccountBlocked && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center p-6 border rounded-lg bg-white shadow-xl max-w-sm">
                            <h2 className="text-xl font-bold">Twoje konto wygasło</h2>
                            <p className="text-muted-foreground mt-2">Wykup subskrypcję, aby odblokować pełen dostęp.</p>
                            <Button onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending} className="mt-4">
                                {checkoutMutation.isPending ? 'Przetwarzanie...' : 'Wykup Subskrypcję'}
                            </Button>
                        </div>
                    </div>
                )}
                <div className="container mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}