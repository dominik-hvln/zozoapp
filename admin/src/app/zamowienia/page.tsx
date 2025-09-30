'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface Order {
    id: string;
    status: string;
    total: number;
    created_at: string;
    userEmail: string;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    postalCode: string;
    phoneNumber: string;
    shippingMethodName: string;
    shippingMethodPrice: number;
    orderItems: Array<{
        quantity: number;
        price: number;
        name: string;
    }> | null;
}

const getOrders = async (): Promise<Order[]> => {
    const response = await api.get('/store/admin/orders');
    return response.data;
};


export default function AdminOrdersPage() {
    const { data: orders, isLoading, error } = useQuery<Order[]>({
        queryKey: ['admin-orders'],
        queryFn: getOrders,
    });

    if (error) {
        toast.error('Nie udało się pobrać zamówień.');
    }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Zarządzanie Zamówieniami</h1>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Zamówienia</TableHead>
                                <TableHead>Klient</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Kwota</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                            <span>Ładowanie zamówień...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {orders?.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{order.userEmail}</TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString('pl-PL')}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{(order.total / 100).toFixed(2)} zł</TableCell>
                                    <TableCell className="text-right">
                                        <OrderDetailsDialog order={order} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function OrderDetailsDialog({ order }: { order: Order }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Zobacz szczegóły</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Szczegóły zamówienia</DialogTitle>
                    <p className="text-sm text-muted-foreground font-mono pt-1">{order.id}</p>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Klient</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p>{order.firstName} {order.lastName}</p>
                                <p className="text-muted-foreground">{order.userEmail}</p>
                                <p className="text-muted-foreground">{order.phoneNumber}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Adres Dostawy</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p>{order.street}</p>
                                <p>{order.postalCode} {order.city}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Produkty w zamówieniu</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="text-sm space-y-2">
                                    {order.orderItems?.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span className="font-medium">{(item.price / 100).toFixed(2)} zł</span>
                                        </li>
                                    )) ?? <li>Brak produktów w zamówieniu.</li>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Dostawa</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span>{order.shippingMethodName}</span>
                                    <span className="font-medium">{(order.shippingMethodPrice / 100).toFixed(2)} zł</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Podsumowanie płatności</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div className="flex justify-between"><span>Data:</span> <span>{new Date(order.created_at).toLocaleString('pl-PL')}</span></div>
                                <div className="flex justify-between items-center"><span>Status:</span> <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>{order.status}</Badge></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base"><span>Suma:</span> <span>{(order.total / 100).toFixed(2)} zł</span></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
