'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

// Import komponentów
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// --- TYPY I FUNKCJE API ---
interface ShippingMethod {
    id: string; name: string; price: number; is_active: boolean;
}
const getShippingMethods = async (): Promise<ShippingMethod[]> => (await api.get('/admin/shipping')).data;
const createShippingMethod = async (data: any) => (await api.post('/admin/shipping', data)).data;

// --- KOMPONENT ---
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
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formState,
            price: Math.round(formState.price * 100), // Cena w groszach
        };
        mutation.mutate(dataToSubmit);
    };

    return (
        <div className="p-10 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Zarządzanie Dostawą</h1>
                <Button onClick={() => setIsOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Metodę</Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Nazwa</TableHead><TableHead>Cena</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={3}>Ładowanie...</TableCell></TableRow>}
                        {shippingMethods?.map(d => (
                            <TableRow key={d.id}>
                                <TableCell>{d.name}</TableCell>
                                <TableCell>{(d.price / 100).toFixed(2)} zł</TableCell>
                                <TableCell><Badge variant={d.is_active ? 'default' : 'destructive'}>{d.is_active ? 'Aktywna' : 'Nieaktywna'}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nowa metoda dostawy</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><Label>Nazwa</Label><Input value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} /></div>
                        <div><Label>Cena (zł)</Label><Input type="number" step="0.01" value={formState.price} onChange={e => setFormState({...formState, price: Number(e.target.value)})} /></div>
                        <div className="flex items-center space-x-2"><Switch checked={formState.is_active} onCheckedChange={c => setFormState({...formState, is_active: c})} /><Label>Aktywna</Label></div>
                        <Button type="submit" className="w-full">Utwórz metodę</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}