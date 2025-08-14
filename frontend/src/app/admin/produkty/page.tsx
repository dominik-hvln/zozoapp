'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

// Import komponentów
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

// --- TYPY I FUNKCJE API ---
interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    is_active: boolean;
}
const getProducts = async (): Promise<Product[]> => (await api.get('/admin/products')).data;
const createProduct = async (data: { name: string, description?: string, price: number }) => (await api.post('/admin/products', data)).data;

// --- KOMPONENT ---
export default function AdminProductsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', price: '0.00' });
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: getProducts });

    const mutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Produkt został pomyślnie dodany!');
            setIsDialogOpen(false);
            setFormData({ name: '', description: '', price: '0.00' });
        },
        onError: () => toast.error('Wystąpił błąd podczas dodawania produktu.'),
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const priceInCents = Math.round(parseFloat(formData.price) * 100);
        if (isNaN(priceInCents) || priceInCents < 0) {
            toast.error('Nieprawidłowa cena.');
            return;
        }
        mutation.mutate({ ...formData, price: priceInCents });
    };

    return (
        <div className="p-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Zarządzanie Produktami</h1>
                    <p className="text-muted-foreground">Dodawaj i edytuj produkty dostępne w sklepie.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" />Dodaj Produkt</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Dodaj nowy produkt</DialogTitle></DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nazwa produktu</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Opis</Label>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Cena (PLN)</Label>
                                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} />
                            </div>
                            <Button type="submit" disabled={mutation.isPending} className="w-full">
                                {mutation.isPending ? 'Dodawanie...' : 'Dodaj produkt'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Nazwa</TableHead><TableHead>Cena</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Ładowanie...</TableCell></TableRow>}
                        {products?.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{(product.price / 100).toFixed(2)} zł</TableCell>
                                <TableCell>{product.is_active ? 'Aktywny' : 'Ukryty'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}