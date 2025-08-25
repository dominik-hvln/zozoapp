'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Header } from '@/components/layout/Header';
import { PartyPopper, XCircle, Loader2 } from 'lucide-react';
import { App } from '@capacitor/app';

// Komponent do obsługi powrotu z płatności (dla wersji webowej)
function PaymentStatus() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('payment');
    const { setToken } = useAuthStore.getState();
    const queryClient = useQueryClient();

    const refreshMutation = useMutation({
        mutationFn: () => api.post('/auth/refresh'),
        onSuccess: (response) => {
            setToken(response.data.access_token);
            queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
            toast.success('Płatność zakończona pomyślnie!', {
                description: 'Dziękujemy! Twoje konto jest ponownie aktywne.',
                icon: <PartyPopper className="h-5 w-5 text-green-500" />
            });
            router.replace('/panel'); // Czyścimy URL bez przeładowania
        },
        onError: () => {
            toast.error("Wystąpił błąd sesji", { description: "Proszę, zaloguj się ponownie."});
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
    });

    useEffect(() => {
        // Ta logika jest przeznaczona tylko dla przeglądarek
        if (status === 'success' && !Capacitor.isNativePlatform()) {
            refreshMutation.mutate();
        }
        if (status === 'cancel' && !Capacitor.isNativePlatform()) {
            toast.error('Płatność anulowana', { icon: <XCircle className="h-5 w-5 text-red-500" /> });
            router.replace('/panel');
        }
    }, [status, router, refreshMutation]);

    // Wyświetlamy loader tylko w trakcie odświeżania sesji
    if (refreshMutation.isPending) {
        return (
            <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="text-center p-4 bg-white rounded-lg shadow-lg">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="font-semibold">Finalizowanie płatności...</p>
                    <p className="text-sm text-muted-foreground">Proszę czekać, odświeżamy Twoją sesję.</p>
                </div>
            </div>
        );
    }

    return null;
}

// Główny layout panelu
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

    // Mutacja do rozpoczynania płatności
    const checkoutMutation = useMutation({
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
        onError: () => toast.error('Nie udało się rozpocząć procesu płatności. Spróbuj ponownie.'),
    });

    if (!isClient || !token) {
        return <div className="flex h-screen items-center justify-center">Sprawdzanie autoryzacji...</div>;
    }

    const isAccountBlocked = user?.status === 'BLOCKED';

    return (
        <>
            <PaymentStatus />
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
        </>
    );
}