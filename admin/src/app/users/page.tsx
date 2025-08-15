'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    created_at: string;
}

const getUsers = async (): Promise<User[]> => {
    const response = await api.get('/admin/users');
    return response.data;
}

export default function AdminUsersPage() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();

    // Ochrona trasy po stronie klienta
    useEffect(() => {
        if (user && user.role !== 'ADMIN') {
            router.push('/panel'); // Przekieruj, jeśli nie jest adminem
        }
    }, [user, router]);

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['admin-users'],
        queryFn: getUsers,
        enabled: user?.role === 'ADMIN', // Uruchom zapytanie tylko, jeśli użytkownik jest adminem
    });

    if (!user || user.role !== 'ADMIN') {
        return <div className="p-10">Przekierowywanie...</div>;
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold">Zarządzanie Użytkownikami</h1>
            <p className="text-muted-foreground mb-6">Lista wszystkich kont w systemie.</p>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Imię</TableHead>
                            <TableHead>Rola</TableHead>
                            <TableHead>Data Rejestracji</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Ładowanie...</TableCell></TableRow>}
                        {error && <TableRow><TableCell colSpan={4} className="text-center text-red-500">Błąd: Brak uprawnień lub problem z serwerem.</TableCell></TableRow>}
                        {users?.map((u) => (
                            <TableRow
                                key={u.id}
                                onClick={() => router.push(`/admin/users/${u.id}`)} // Dodajemy akcję onClick
                                className="cursor-pointer hover:bg-gray-50" // Zmieniamy kursor
                            >
                                <TableCell className="font-medium">{u.email}</TableCell>
                                <TableCell>{u.name || '-'}</TableCell>
                                <TableCell><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
                                <TableCell>{new Date(u.created_at).toLocaleDateString('pl-PL')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}