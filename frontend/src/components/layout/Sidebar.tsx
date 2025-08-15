'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Sticker, ShoppingCart, Settings, Package, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { ShieldCheck } from 'lucide-react'; // Dodaj nową ikonę

const links = [
    { href: '/panel', label: 'Panel Główny', icon: Home },
    { href: '/panel/dzieci', label: 'Moje Dzieci', icon: Users },
    { href: '/panel/tatuaze', label: 'Aktywne Tatuaże', icon: Sticker },
    { href: '/panel/sklep', label: 'Sklep', icon: ShoppingCart },
];

const bottomLinks = [
    { href: '/panel/ustawienia', label: 'Ustawienia', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuthStore();

    return (
        <aside className="w-64 flex-shrink-0 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b">
                <Link href="/panel" className="text-2xl font-bold tracking-tighter text-gray-900">
                    ZozoApp
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
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            {link.label}
                        </Link>
                    );
                })}
                {user?.role === 'ADMIN' && (
                    <><Link
                        href="/admin"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-4 border-t ${pathname.startsWith('/admin') // Ta logika pozostaje bez zmian
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <ShieldCheck className="h-5 w-5"/>
                        Panel Admina
                    </Link><><Link
                        href="/admin/users"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/users')
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <ShieldCheck className="h-5 w-5"/>
                        Użytkownicy
                    </Link><Link
                        href="/admin/tattoos"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/tattoos')
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <Sticker className="h-5 w-5"/>
                        Zarządzaj Tatuażami
                    </Link><Link
                            href="/admin/produkty"
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith('/admin/produkty')
                                ? 'bg-blue-100 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            <Package className="h-5 w-5"/>
                            Zarządzaj produktami
                        </Link></>
                    </>
                )}
            </nav>

            <div className="p-4 mt-auto border-t">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="" /> {/* Można dodać link do avatara usera */}
                        <AvatarFallback>{user?.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                </div>
                <nav className="flex flex-col space-y-1">
                    <Link
                        href="/panel/ustawienia"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pathname === '/panel/ustawienia'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                        }`}
                    >
                        <Settings className="h-5 w-5" />
                        Ustawienia
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-primary/5 hover:text-primary w-full"
                    >
                        <LogOut className="h-5 w-5" />
                        Wyloguj się
                    </button>
                </nav>
            </div>
        </aside>
    );
}