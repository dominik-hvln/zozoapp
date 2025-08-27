'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Header } from '@/components/layout/Header';
import { PartyPopper, XCircle, Loader2 } from 'lucide-react';
import { App } from '@capacitor/app';
import { cn } from '@/lib/utils';
import { initializePushNotifications } from '@/lib/push-notifications.service';

// --- FUNKCJE API (bez zmian) ---
const getFullProfile = async () => (await api.get('/auth/profile')).data;

function PaymentStatusComponent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('payment');
    const { setToken } = useAuthStore.getState();
    const queryClient = useQueryClient();
    const [hasProcessed, setHasProcessed] = useState(false);

    const refreshMutation = useMutation({
        mutationFn: () => api.post('/auth/refresh'),
        onSuccess: (response) => {
            setToken(response.data.access_token);
            queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
            toast.success('Płatność zakończona pomyślnie!');
            router.replace('/panel');
        },
        onError: () => {
            toast.error("Wystąpił błąd sesji");
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
    });

    useEffect(() => {
        if (status === 'success' && !hasProcessed) {
            setHasProcessed(true);
            refreshMutation.mutate();
        }
        if (status === 'cancel') {
            router.replace('/panel');
        }
    }, [status, router, refreshMutation, hasProcessed]);

    if (refreshMutation.isPending) {
        return (
            <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
                <div className="text-center p-4 bg-white rounded-lg shadow-lg">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Finalizowanie płatności...</p>
                </div>
            </div>
        );
    }

    return null;
}

function PaymentStatus() {
    return (
        <Suspense fallback={null}>
            <PaymentStatusComponent />
        </Suspense>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
    const { token, setToken, initializeAuth, isInitialized } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    // --- NOWY STAN ---
    // Będzie przechowywał informację, czy aplikacja działa w trybie natywnym.
    const [isNative, setIsNative] = useState(false);

    useSocket();

    const { data: fullProfile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['fullProfile'],
        queryFn: getFullProfile,
        enabled: isInitialized && !!token,
        retry: 1,
    });

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
        onError: () => toast.error('Nie udało się rozpocząć procesu płatności.'),
    });

    useEffect(() => {
        initializeAuth();
        setIsNative(Capacitor.isNativePlatform());
    }, [initializeAuth]);

    useEffect(() => {
        if (isInitialized && !token) {
            router.push('/login');
        }
        if (isInitialized && token) {
            initializePushNotifications();
        }
    }, [token, router, isInitialized]);

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            const listenerPromise = App.addListener('appUrlOpen', () => {
                Browser.close();
                toast.info('Przetwarzanie płatności...');
                api.post('/auth/refresh').then(response => {
                    setToken(response.data.access_token);
                    queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
                    toast.success('Płatność zakończona pomyślnie!');
                });
            });
            return () => {
                listenerPromise.then(listener => listener.remove());
            };
        }
    }, [queryClient, setToken]);

    if (!isInitialized || (token && isProfileLoading)) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!token) {
        return null;
    }

    const isAccountBlocked = fullProfile?.account_status === 'BLOCKED';

    return (
        <>
            <PaymentStatus />
            {/* --- POPRAWKA TUTAJ --- */}
            {/* Używamy funkcji `cn` do warunkowego dodania klasy `pt-safe`. */}
            <div className={cn("flex min-h-screen w-full flex-col", { "pt-safe": isNative })}>
                <Header />
                <main className="flex-1 p-4 lg:p-8 relative">
                    {isAccountBlocked ? (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="text-center p-6 border rounded-lg bg-white shadow-xl max-w-sm">
                                <h2 className="text-xl font-bold">Twoje konto wygasło</h2>
                                <p className="text-muted-foreground mt-2">Wykup subskrypcję, aby odblokować pełen dostęp.</p>
                                <Button onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending} className="mt-4">
                                    {checkoutMutation.isPending ? 'Przetwarzanie...' : 'Wykup Subskrypcję'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        fullProfile && (
                            <div className="container mx-auto">
                                {children}
                            </div>
                        )
                    )}
                </main>
            </div>
        </>
    );
}
