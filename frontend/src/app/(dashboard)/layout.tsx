'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, PartyPopper, XCircle, Loader2, ShoppingCart } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { Header } from '@/components/layout/Header';

function PaymentStatus() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get('payment');
    const { setToken } = useAuthStore.getState();

    const refreshMutation = useMutation({
        mutationFn: () => api.post('/auth/refresh'),
        onSuccess: (response) => {
            const { access_token } = response.data;
            setToken(access_token); // Podmieniamy token na nowy
            toast.success('Płatność zakończona pomyślnie!', {
                description: 'Dziękujemy! Twoje konto jest ponownie aktywne.',
                icon: <PartyPopper className="h-5 w-5 text-green-500" />
            });
            router.replace('/panel');
        },
        onError: () => {
            toast.error("Wystąpił błąd sesji", { description: "Proszę, zaloguj się ponownie."});
            setTimeout(() => { window.location.href = '/login'; }, 2000);
        }
    });

    useEffect(() => {
        if (status === 'success') {
            refreshMutation.mutate();
        }
        if (status === 'cancel') {
            toast.error('Płatność anulowana', { icon: <XCircle className="h-5 w-5 text-red-500" /> });
            router.replace('/panel');
        }
    }, [status, router]);

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

export default function DashboardLayout({ children }: { children: React.ReactNode; }) {
    const { token, user, logout } = useAuthStore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useSocket();

    useEffect(() => { setIsClient(true); }, []);
    useEffect(() => {
        if (isClient && !token) {
            router.push('/login');
        }
    }, [token, router, isClient]);

    const checkoutMutation = useMutation({
        mutationFn: () => api.post('/store/checkout/subscription'),
        onSuccess: (response) => {
            window.location.href = response.data.url;
        },
        onError: () => toast.error('Nie udało się rozpocząć procesu płatności. Spróbuj ponownie.'),
    });

    if (!isClient || !token) {
        return <div className="flex h-screen items-center justify-center">Sprawdzanie autoryzacji...</div>;
    }

    const isAccountBlocked = user?.status === 'BLOCKED';
    return (
        <>
            <PaymentStatus /> {/* Dodajemy komponent obsługi płatności */}
            <div className="grid min-h-screen w-full mt-6">
                <div className="flex flex-col">
                    <Header />
                    <main className="container mx-auto flex-1 overflow-y-auto py-8 px-4 md:px-0 relative">
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
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}