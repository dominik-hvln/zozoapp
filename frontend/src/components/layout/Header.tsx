'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Home, Users, ShoppingCart, User, Settings, Menu, Bell, LogOut } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


// Definicja linków w nawigacji
const mainNavLinks = [
    { href: '/panel', label: 'Panel Rodzica', icon: Home },
    { href: '/panel/dzieci', label: 'Przegląd dzieci', icon: Users },
    { href: '/panel/sklep', label: 'Sklep', icon: ShoppingCart },
    { href: '/panel/profil', label: 'Profil', icon: User },
];

function NavLinks() {
    const pathname = usePathname();
    return (
        <>
            {mainNavLinks.map(link => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center text-sm font-medium transition-colors px-4 py-2 rounded-full ${
                        pathname === link.href
                            ? 'bg-white/90 text-blue-700 shadow-sm'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                </Link>
            ))}
        </>
    );
}

export function Header() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const notificationCount = 1;

    // Prosta funkcja do formatowania daty
    const formattedDate = new Intl.DateTimeFormat('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date());

    return (
        <header className="text-white sticky top-4 z-40 px-4">
            <div className="container mx-auto bg-[#466ec6] flex h-16 lg:h-20 items-center justify-between px-4 rounded-[20px]">
                <div className="flex items-center gap-6">
                    <Link href="/panel">
                        <Image src="/logo.png" alt="ZozoApp Logo" width={150} height={52} priority className="hidden md:block" />
                        <Image src="/logo.png" alt="ZozoApp Logo" width={100} height={35} priority className="block md:hidden" />
                    </Link>
                    <div className="hidden lg:block text-sm">
                        <p className="font-medium">Dzisiejszy dzień</p>
                        <p className="text-white/80">{formattedDate}</p>
                    </div>
                </div>

                <nav className="hidden md:flex items-center gap-2 bg-black/10 p-1 rounded-full">
                    <NavLinks />
                </nav>

                <div className="flex items-center gap-2">
                    <Link href="/panel/ustawienia">
                        <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20 hover:text-white">
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="relative rounded-full text-white hover:bg-white/20 hover:text-white">
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1 right-1.5 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full text-black">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={user?.email} />
                                    <AvatarFallback>{user?.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">Zalogowano jako</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/panel/ustawienia"><Settings className="mr-2 h-4 w-4" /> Ustawienia</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" /> Wyloguj się</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-white/20 hover:text-white">
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-[#466ec6] text-white border-r-0 p-0">
                                <SheetHeader>
                                    <SheetTitle className="p-4 border-b border-white/20">
                                        <Link href="/panel"><Image src="/logo.png" alt="ZozoApp Logo" width={110} height={35} /></Link>
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="grid gap-2 text-base font-medium p-4">
                                    <NavLinks />
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}