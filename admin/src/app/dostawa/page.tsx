'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    is_active: boolean;
}

interface CreateShippingDto {
    name: string;
    price: number;
    is_active: boolean;
}

const getShippingMethods = async (): Promise<ShippingMethod[]> => (await api.get('/admin/shipping')).data;
const createShippingMethod = async (data: CreateShippingDto) => (await api.post('/admin/shipping', data)).data;

export default function AdminShippingPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [formState, setFormState] = useState({ name: '', price: 0, is_active: true });
    const queryClient = useQueryClient();
    const { data: shippingMethods, isLoading } = useQuery({ queryKey: ['admin-shipping'], queryFn: getShippingMethods });

    const mutation = useMutation({
        mutationFn: createShippingMethod,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping'] });
            toast.success('Metoda dostawy została utworzona!');
            setIsOpen(false);
            setFormState({ name: '', price: 0, is_active: true });
        },
        onError: () => {
            toast.error('Wystąpił błąd podczas tworzenia metody dostawy.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit: CreateShippingDto = {
            ...formState,
            price: Math.round(formState.price * 100),
        };
        mutation.mutate(dataToSubmit);
    };

    return (
        <div className="p-4 md:p-6 lg:p-10 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold">Zarządzanie Dostawą</h1>
                <Button onClick={() => setIsOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Metodę</Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Cena</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Ładowanie...</TableCell></TableRow>}
                        {shippingMethods?.map(d => (
                            <TableRow key={d.id}>
                                <TableCell className="font-medium">{d.name}</TableCell>
                                <TableCell>{(d.price / 100).toFixed(2)} zł</TableCell>
                                <TableCell>
                                    <Badge variant={d.is_active ? 'default' : 'destructive'}>
                                        {d.is_active ? 'Aktywna' : 'Nieaktywna'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nowa metoda dostawy</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="name">Nazwa</Label>
                            <Input id="name" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} required />
                        </div>
                        <div>
                            <Label htmlFor="price">Cena (zł)</Label>
                            <Input id="price" type="number" step="0.01" value={formState.price} onChange={e => setFormState({...formState, price: Number(e.target.value)})} required />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Switch id="is_active" checked={formState.is_active} onCheckedChange={c => setFormState({...formState, is_active: c})} />
                            <Label htmlFor="is_active">Aktywna</Label>
                        </div>
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Tworzenie...' : 'Utwórz metodę'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
