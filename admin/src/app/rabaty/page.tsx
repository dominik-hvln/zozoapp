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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

// --- TYPY I FUNKCJE API ---
// POPRAWKA: Definiujemy precyzyjny, bezpieczny typ
interface DiscountCode {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}
// POPRAWKA: Definiujemy typ dla danych wejściowych
type CreateDiscountCodeDto = Omit<DiscountCode, 'id' | 'created_at' | 'expires_at'>;

const getDiscountCodes = async (): Promise<DiscountCode[]> => (await api.get('/admin/discounts')).data;
const createDiscountCode = async (data: CreateDiscountCodeDto) => (await api.post('/admin/discounts', data)).data;

// --- KOMPONENT ---
export default function AdminDiscountsPage() {
    const [isOpen, setIsOpen] = useState(false);
    const [formState, setFormState] = useState({
        code: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
        value: 10,
        is_active: true,
    });
    const queryClient = useQueryClient();

    const { data: discounts, isLoading } = useQuery({ queryKey: ['admin-discounts'], queryFn: getDiscountCodes });

    const mutation = useMutation({
        mutationFn: createDiscountCode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
            toast.success('Kod rabatowy został pomyślnie utworzony!');
            setIsOpen(false);
        },
        onError: () => toast.error('Błąd podczas tworzenia kodu.')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSubmit = {
            ...formState,
            value: formState.type === 'FIXED_AMOUNT' ? Math.round(formState.value * 100) : formState.value,
        };
        mutation.mutate(dataToSubmit);
    };

    return (
        <div className="p-10 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Kody Rabatowe</h1>
                <Button onClick={() => setIsOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Kod</Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Typ</TableHead><TableHead>Wartość</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Ładowanie...</TableCell></TableRow>}
                        {discounts?.map(d => (
                            <TableRow key={d.id}>
                                <TableCell className="font-mono">{d.code}</TableCell>
                                <TableCell>{d.type === 'PERCENTAGE' ? 'Procentowy' : 'Kwotowy'}</TableCell>
                                <TableCell>{d.type === 'PERCENTAGE' ? `${d.value}%` : `${(d.value / 100).toFixed(2)} zł`}</TableCell>
                                <TableCell><Badge variant={d.is_active ? 'default' : 'destructive'}>{d.is_active ? 'Aktywny' : 'Wygasły'}</Badge></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Nowy kod rabatowy</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div><Label>Kod</Label><Input value={formState.code} onChange={e => setFormState({...formState, code: e.target.value.toUpperCase()})} /></div>
                        <div><Label>Typ</Label>
                            {/* POPRAWKA: Używamy poprawnego typu dla `onValueChange` */}
                            <Select value={formState.type} onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') => setFormState({...formState, type: value})}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Procentowy (%)</SelectItem>
                                    <SelectItem value="FIXED_AMOUNT">Kwotowy (zł)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label>Wartość</Label><Input type="number" value={formState.value} onChange={e => setFormState({...formState, value: Number(e.target.value)})} /></div>
                        <div className="flex items-center space-x-2"><Switch checked={formState.is_active} onCheckedChange={c => setFormState({...formState, is_active: c})} /><Label>Aktywny</Label></div>
                        <Button type="submit" className="w-full" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Tworzenie...' : 'Utwórz kod'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}