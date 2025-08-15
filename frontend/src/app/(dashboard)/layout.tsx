'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const { token, user } = useAuthStore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !token) {
            router.push('/login');
        }
    }, [token, router, isClient]);

    if (!isClient || !token) {
        return (
            <div className="flex h-screen items-center justify-center">
                Sprawdzanie autoryzacji...
            </div>
        );
    }

    const isAccountBlocked = user?.status === 'BLOCKED';

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className={`hidden border-r bg-muted/40 md:block ${isAccountBlocked ? 'pointer-events-none' : ''}`}>
                <Sidebar />
            </div>

            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0 w-64">
                            <SheetHeader className='sr-only'>
                                <SheetTitle>Menu Główne</SheetTitle>
                            </SheetHeader>
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <div className="text-lg font-bold">ZozoApp</div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
                    {/* Warstwa "wyszarzająca" dla zablokowanych kont */}
                    {isAccountBlocked && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="text-center p-6 border rounded-lg bg-white shadow-xl max-w-sm">
                                <h2 className="text-xl font-bold">Twoje konto wygasło</h2>
                                <p className="text-muted-foreground mt-2">Wykup subskrypcję, aby odblokować pełen dostęp.</p>
                                <Button className="mt-4">Wykup Subskrypcję</Button>
                            </div>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}