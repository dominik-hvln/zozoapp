'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, PartyPopper, XCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser'; // Import nowej wtyczki

// Komponent do obsługi statusu płatności (z "cichym odświeżeniem")
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
            toast.success('Płatność zakończona pomyślnie!', { description: 'Twoje konto jest ponownie aktywne.' });
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
            toast.error('Płatność anulowana');
            router.replace('/panel');
        }
    }, [status, router, refreshMutation]);

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
    const { token, user } = useAuthStore();
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
        onSuccess: async (response) => {
            const { url } = response.data;
            // OSTATECZNA POPRAWKA: Używamy In-App Browser
            await Browser.open({ url });
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
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <div className={`hidden border-r bg-muted/40 md:block ${isAccountBlocked ? 'pointer-events-none' : ''}`}>
                    <Sidebar />
                </div>
                <div className="flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden relative z-20">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0"><Menu className="h-5 w-5" /></Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex flex-col p-0 w-64">
                                <SheetHeader className='sr-only'><SheetTitle>Menu Główne</SheetTitle></SheetHeader>
                                <Sidebar />
                            </SheetContent>
                        </Sheet>
                        <div className="text-lg font-bold">ZozoApp</div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
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