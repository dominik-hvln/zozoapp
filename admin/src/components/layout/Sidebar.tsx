'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Users, Sticker, Package, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const links = [
    { href: '/admin', label: 'Dashboard', icon: ShieldCheck },
    { href: '/users', label: 'Użytkownicy', icon: Users },
    { href: '/tattoos', label: 'Tatuaże', icon: Sticker },
    { href: '/produkty', label: 'Produkty', icon: Package },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();

    return (
        <aside className="w-64 h-full bg-muted/40 flex flex-col">
            <div className="p-4 border-b">
                <Link href="/admin" className="text-2xl font-bold tracking-tighter text-gray-900">
                    ZozoApp Admin
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                pathname === link.href
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto border-t">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-primary/5 hover:text-primary w-full"
                >
                    <LogOut className="h-5 w-5" />
                    Wyloguj się
                </button>
            </div>
        </aside>
    );
}