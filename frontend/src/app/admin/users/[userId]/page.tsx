'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserDetails {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    created_at: string;
    phone: string | null;
    children: {
        id: string;
        name: string;
        _count: { assignments: number };
    }[];
}

const getUserDetails = async (userId: string): Promise<UserDetails> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
}

export default function UserDetailsPage() {
    const params = useParams();
    const userId = params.userId as string;

    const { data: user, isLoading, error } = useQuery({
        queryKey: ['admin-user-details', userId],
        queryFn: () => getUserDetails(userId),
        enabled: !!userId,
    });

    if (isLoading) return <div className="p-10">Ładowanie danych użytkownika...</div>;
    if (error) return <div className="p-10 text-red-500">Nie udało się pobrać danych.</div>;
    if (!user) return null;

    return (
        <div className="p-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
                <p className="text-muted-foreground">Szczegóły konta i powiązana aktywność.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Informacje Podstawowe</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Imię:</strong> {user.name || 'Nie podano'}</p>
                        <p><strong>Telefon:</strong> {user.phone || 'Nie podano'}</p>
                        <p><strong>Rola:</strong> <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge></p>
                        <p><strong>Data dołączenia:</strong> {new Date(user.created_at).toLocaleString('pl-PL')}</p>
                        <Button className="mt-4">Zmień rolę</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Profile Dzieci ({user.children.length})</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Imię</TableHead><TableHead>Aktywne tatuaże</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {user.children.map(child => (
                                    <TableRow key={child.id}>
                                        <TableCell>{child.name}</TableCell>
                                        <TableCell>{child._count.assignments}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}