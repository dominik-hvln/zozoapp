'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Variant { id: string; quantity: number; price: number; stripe_price_id: string; }
interface Product { id: string; name: string; is_active: boolean; product_variants: Variant[]; }
const getProducts = async (): Promise<Product[]> => (await api.get('/admin/products')).data;
const createProduct = async (data: { name: string, description?: string }) => (await api.post('/admin/products', data)).data;
const addVariant = async (data: { productId: string; quantity: number; price: number; }) =>
    (await api.post(`/admin/products/${data.productId}/variants`, data)).data;


// --- KOMPONENT ---
export default function AdminProductsPage() {
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [productForm, setProductForm] = useState({ name: '', description: '' });
    const [variantForm, setVariantForm] = useState({ quantity: 0, price: 0.00 }); // Uproszczony formularz

    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: getProducts });

    const productMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Produkt został pomyślnie dodany w systemie i w Stripe!');
            setIsProductDialogOpen(false);
        },
    });

    const variantMutation = useMutation({
        mutationFn: addVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Wariant został pomyślnie dodany i zsynchronizowany ze Stripe!');
            setIsVariantDialogOpen(false);
        },
    });

    const handleProductSubmit = (e: React.FormEvent) => { e.preventDefault(); productMutation.mutate(productForm); };
    const handleVariantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        variantMutation.mutate({
            productId: selectedProduct.id,
            ...variantForm,
            price: Math.round(variantForm.price * 100),
        });
    };

    return (
        <div className="p-10 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Zarządzanie Produktami</h1>
                <Button onClick={() => setIsProductDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Produkt</Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader><TableRow><TableHead>Nazwa</TableHead><TableHead>Warianty</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Akcje</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Ładowanie...</TableCell></TableRow>}
                        {products?.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {product.product_variants.map(v => <Badge key={v.id} variant="secondary">{v.quantity} szt.</Badge>)}
                                    </div>
                                </TableCell>
                                <TableCell>{product.is_active ? 'Aktywny' : 'Ukryty'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => { setSelectedProduct(product); setIsVariantDialogOpen(true); }}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Dodaj wariant
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog do dodawania produktu */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Dodaj nowy produkt</DialogTitle></DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
                        <div><Label>Nazwa</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                        <div><Label>Opis</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                        <Button type="submit" className="w-full">Dodaj produkt</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Dodaj wariant do: {selectedProduct?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={handleVariantSubmit} className="space-y-4 pt-4">
                        <div><Label>Ilość (szt.)</Label><Input type="number" value={variantForm.quantity} onChange={e => setVariantForm({...variantForm, quantity: Number(e.target.value)})} /></div>
                        <div><Label>Cena (PLN)</Label><Input type="number" step="0.01" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: Number(e.target.value)})} /></div>
                        <Button type="submit" className="w-full" disabled={variantMutation.isPending}>
                            {variantMutation.isPending ? 'Dodawanie...' : 'Dodaj wariant'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}