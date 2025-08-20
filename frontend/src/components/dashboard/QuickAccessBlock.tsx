'use client';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function QuickAccessBlock() {
    const { user } = useAuthStore();

    if (!user) return null;

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                    <AvatarImage src="" alt={user.email} />
                    <AvatarFallback className="text-xl">
                        {user.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-xl font-bold">Witaj, {user.firstName || 'Użytkowniku'}!</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Szybki dostęp</p>
                <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                        <Link href="/panel/tatuaze/skanuj"><PlusCircle className="h-4 w-4 mr-2" />Aktywuj tatuaż</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/panel/dzieci"><PlusCircle className="h-4 w-4 mr-2" />Dodaj dziecko</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/panel/sklep"><ShoppingCart className="h-4 w-4 mr-2" />Kup tatuaże</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}