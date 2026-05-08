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
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ShippingIntegrationType = 'NONE' | 'INPOST_LOCKER' | 'INPOST_COURIER';

interface ShippingMethod {
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    integration_type: ShippingIntegrationType;
}

interface CreateShippingDto {
    name: string;
    price: number;
    is_active: boolean;
    integration_type: ShippingIntegrationType;
}

const getShippingMethods = async (): Promise<ShippingMethod[]> => (await api.get('/admin/shipping')).data;
const createShippingMethod = async (data: CreateShippingDto) => (await api.post('/admin/shipping', data)).data;
const updateShippingMethod = async (params: { id: string; data: CreateShippingDto }) =>
    (await api.put(`/admin/shipping/${params.id}`, params.data)).data;
const deleteShippingMethod = async (id: string) => (await api.delete(`/admin/shipping/${id}`)).data;

export default function AdminShippingPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
    const [formState, setFormState] = useState<CreateShippingDto>({
        name: '',
        price: 0,
        is_active: true,
        integration_type: 'NONE',
    });
    const queryClient = useQueryClient();
    const { data: shippingMethods, isLoading } = useQuery({ queryKey: ['admin-shipping'], queryFn: getShippingMethods });

    const createMutation = useMutation({
        mutationFn: createShippingMethod,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping'] });
            toast.success('Metoda dostawy została utworzona!');
            setIsOpen(false);
            setFormState({ name: '', price: 0, is_active: true, integration_type: 'NONE' });
        },
        onError: () => {
            toast.error('Wystąpił błąd podczas tworzenia metody dostawy.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateShippingMethod,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping'] });
            toast.success('Metoda dostawy została zaktualizowana!');
            setIsOpen(false);
            setEditingMethod(null);
            setFormState({ name: '', price: 0, is_active: true, integration_type: 'NONE' });
        },
        onError: () => {
            toast.error('Wystąpił błąd podczas aktualizacji metody dostawy.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteShippingMethod,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shipping'] });
            toast.success('Metoda dostawy została wyłączona.');
        },
        onError: () => {
            toast.error('Nie udało się usunąć metody dostawy.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit: CreateShippingDto = {
            ...formState,
            price: Math.round(formState.price * 100),
        };
        if (editingMethod) {
            updateMutation.mutate({ id: editingMethod.id, data: dataToSubmit });
            return;
        }
        createMutation.mutate(dataToSubmit);
    };

    const openCreateDialog = () => {
        setEditingMethod(null);
        setFormState({ name: '', price: 0, is_active: true, integration_type: 'NONE' });
        setIsOpen(true);
    };

    const openEditDialog = (method: ShippingMethod) => {
        setEditingMethod(method);
        setFormState({
            name: method.name,
            price: method.price / 100,
            is_active: method.is_active,
            integration_type: method.integration_type ?? 'NONE',
        });
        setIsOpen(true);
    };

    const getIntegrationLabel = (type: ShippingIntegrationType) => {
        if (type === 'INPOST_LOCKER') return 'InPost Paczkomat';
        if (type === 'INPOST_COURIER') return 'InPost Kurier';
        return 'Brak integracji';
    };

    return (
        <div className="p-4 md:p-6 lg:p-10 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold">Zarządzanie Dostawą</h1>
                <Button onClick={openCreateDialog}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Metodę</Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nazwa</TableHead>
                            <TableHead>Cena</TableHead>
                            <TableHead>Integracja</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Akcje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Ładowanie...</TableCell></TableRow>}
                        {shippingMethods?.map(d => (
                            <TableRow key={d.id}>
                                <TableCell className="font-medium">{d.name}</TableCell>
                                <TableCell>{(d.price / 100).toFixed(2)} zł</TableCell>
                                <TableCell>{getIntegrationLabel(d.integration_type ?? 'NONE')}</TableCell>
                                <TableCell>
                                    <Badge variant={d.is_active ? 'default' : 'destructive'}>
                                        {d.is_active ? 'Aktywna' : 'Nieaktywna'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => openEditDialog(d)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edytuj
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(d.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Usuń
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingMethod ? 'Edytuj metodę dostawy' : 'Nowa metoda dostawy'}</DialogTitle></DialogHeader>
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
                        <div>
                            <Label htmlFor="integration_type">Typ integracji</Label>
                            <Select
                                value={formState.integration_type}
                                onValueChange={(value: ShippingIntegrationType) => setFormState({ ...formState, integration_type: value })}
                            >
                                <SelectTrigger id="integration_type">
                                    <SelectValue placeholder="Wybierz typ integracji" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Brak integracji</SelectItem>
                                    <SelectItem value="INPOST_LOCKER">InPost Paczkomat</SelectItem>
                                    <SelectItem value="INPOST_COURIER">InPost Kurier</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending)
                                ? 'Zapisywanie...'
                                : editingMethod ? 'Zapisz zmiany' : 'Utwórz metodę'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
