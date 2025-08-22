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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from '@/lib/utils';

// --- TYPY I FUNKCJE API ---
interface Variant { id: string; quantity: number; price: number; stripe_price_id: string; }
interface Category { id: string; name: string; }
interface Product { id: string; name: string; is_active: boolean; product_variants: Variant[]; categories: Category[]; }

const getProducts = async (): Promise<Product[]> => (await api.get('/admin/products')).data;
const createProduct = async (data: { name: string, description?: string, categoryIds: string[] }) => (await api.post('/admin/products', data)).data;
const addVariant = async (data: { productId: string; quantity: number; price: number; }) => (await api.post(`/admin/products/${data.productId}/variants`, data)).data;
const getCategories = async (): Promise<Category[]> => (await api.get('/admin/categories')).data;
const createCategory = async (name: string) => (await api.post('/admin/categories', { name })).data;

// --- KOMPONENT ---
export default function AdminProductsPage() {
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [productForm, setProductForm] = useState({ name: '', description: '', categoryIds: [] as string[] });
    const [variantForm, setVariantForm] = useState({ quantity: 0, price: 0.00 });
    const [newCategoryName, setNewCategoryName] = useState('');

    const queryClient = useQueryClient();

    const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: getProducts });
    const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: getCategories });

    const productMutation = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Produkt został pomyślnie dodany!');
            setIsProductDialogOpen(false);
            setProductForm({ name: '', description: '', categoryIds: [] });
        },
    });

    const variantMutation = useMutation({
        mutationFn: addVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            toast.success('Wariant został pomyślnie dodany!');
            setIsVariantDialogOpen(false);
            setVariantForm({ quantity: 0, price: 0.00 });
        },
    });

    const categoryMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            toast.success('Kategoria została dodana!');
            setNewCategoryName('');
        }
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
    const handleCategorySubmit = (e: React.FormEvent) => { e.preventDefault(); categoryMutation.mutate(newCategoryName); };

    return (
        <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Lewa kolumna: Produkty */}
            <main className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Zarządzanie Produktami</h1>
                    <Button onClick={() => setIsProductDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Produkt</Button>
                </div>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader><TableRow><TableHead>Nazwa</TableHead><TableHead>Kategorie</TableHead><TableHead>Warianty</TableHead><TableHead className="text-right">Akcje</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={4}>Ładowanie...</TableCell></TableRow>}
                            {products?.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell><div className="flex flex-wrap gap-1">{product.categories.map(c => <Badge key={c.id} variant="outline">{c.name}</Badge>)}</div></TableCell>
                                    <TableCell><div className="flex flex-wrap gap-1">{product.product_variants.map(v => <Badge key={v.id} variant="secondary">{v.quantity} szt.</Badge>)}</div></TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => { setSelectedProduct(product); setIsVariantDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Dodaj wariant</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </main>
            <aside className="lg:col-span-1 sticky top-24">
                <Card>
                    <CardHeader><CardTitle>Kategorie Produktów</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
                            <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nazwa nowej kategorii" />
                            <Button type="submit">Dodaj</Button>
                        </form>
                        <div className="space-y-2">
                            {categories?.map(cat => <Badge key={cat.id}>{cat.name}</Badge>)}
                        </div>
                    </CardContent>
                </Card>
            </aside>

            {/* Dialog do dodawania produktu */}
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Dodaj nowy produkt</DialogTitle></DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
                        <div><Label>Nazwa</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                        <div><Label>Opis</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                        <div>
                            <Label>Kategorie</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {productForm.categoryIds.length > 0 ? `${productForm.categoryIds.length} zaznaczono` : "Wybierz kategorie..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Szukaj kategorii..." />
                                        <CommandList>
                                            <CommandEmpty>Brak kategorii.</CommandEmpty>
                                            <CommandGroup>
                                                {categories?.map(cat => (
                                                    <CommandItem
                                                        key={cat.id}
                                                        value={cat.name}
                                                        onSelect={() => {
                                                            const isSelected = productForm.categoryIds.includes(cat.id);
                                                            setProductForm(prev => ({
                                                                ...prev,
                                                                categoryIds: isSelected ? prev.categoryIds.filter(id => id !== cat.id) : [...prev.categoryIds, cat.id]
                                                            }));
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", productForm.categoryIds.includes(cat.id) ? "opacity-100" : "opacity-0")} />
                                                        {cat.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
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
