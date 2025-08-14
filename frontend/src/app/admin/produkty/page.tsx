'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    is_active: boolean;
}
const getProducts = async (): Promise<Product[]> => (await api.get('/admin/products')).data;
const createProduct = async (data: { name: string, description?: string, price: number }) => (await api.post('/admin/products', data)).data;

const formSchema = z.object({
    name: z.string().min(3, { message: 'Nazwa musi mieć co najmniej 3 znaki.' }),
    description: z.string().optional(),
    price: z.preprocess(
        (val) => parseFloat(String(val)),
        z.number().min(0, { message: 'Cena nie może być ujemna.' })
    ),
});
type FormValues = z.infer<typeof formSchema>;

export default function AdminProductsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: getProducts });
    const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { name: '', description: '', price: 0.00 } });

    const mutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Produkt został pomyślnie dodany!');
            setIsDialogOpen(false);
            form.reset();
        },
        onError: () => toast.error('Wystąpił błąd podczas dodawania produktu.'),
    });

    function onSubmit(values: FormValues) {
        // Przesyłamy cenę w groszach
        mutation.mutate({ ...values, price: Math.round(values.price * 100) });
    }

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
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Nazwa produktu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Opis</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem><FormLabel>Cena (PLN)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" disabled={mutation.isPending} className="w-full">
                                    {mutation.isPending ? 'Dodawanie...' : 'Dodaj produkt'}
                                </Button>
                            </form>
                        </Form>
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