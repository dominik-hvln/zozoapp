'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Upload, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Variant { id: string; quantity: number; price: number; stripe_price_id: string; }
interface Category { id: string; name: string; }
interface Product {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    image_url: string | null;
    product_variants: Variant[];
    categories: Category[];
}

const getProducts = async (): Promise<Product[]> => (await api.get('/admin/products')).data;
const createProduct = async (data: { name: string, description?: string, categoryIds: string[] }) => (await api.post('/admin/products', data)).data;
const updateProduct = async (data: { id: string; name: string; description: string; isActive: boolean; categoryIds: string[] }) => (await api.put(`/admin/products/${data.id}`, data)).data;
const deleteProduct = async (productId: string) => (await api.delete(`/admin/products/${productId}`)).data;
const uploadProductImage = async ({ productId, file }: { productId: string; file: File }) => {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post(`/uploads/product/${productId}`, formData)).data;
};
const addVariant = async (data: { productId: string; quantity: number; price: number; }) => (await api.post(`/admin/products/${data.productId}/variants`, data)).data;
const updateVariant = async (data: { variantId: string; quantity: number; price: number; }) => (await api.put(`/admin/products/variants/${data.variantId}`, data)).data;
const deleteVariant = async (variantId: string) => (await api.delete(`/admin/products/variants/${variantId}`)).data;
const getCategories = async (): Promise<Category[]> => (await api.get('/admin/categories')).data;
const createCategory = async (name: string) => (await api.post('/admin/categories', { name })).data;

export default function AdminProductsPage() {
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState({ name: '', description: '', categoryIds: [] as string[] });
    const [editProductForm, setEditProductForm] = useState({ name: '', description: '', isActive: true, categoryIds: [] as string[] });
    const [productImageFile, setProductImageFile] = useState<File | null>(null);
    const [variantForm, setVariantForm] = useState({ quantity: 0, price: 0.00 });
    const [newCategoryName, setNewCategoryName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const { data: products, isLoading } = useQuery({ queryKey: ['admin-products'], queryFn: getProducts });
    const { data: categories } = useQuery({ queryKey: ['admin-categories'], queryFn: getCategories });

    const imageMutation = useMutation({ mutationFn: uploadProductImage, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Zdjęcie zaktualizowane!'); }, onError: (error) => { console.error(error); toast.error('Błąd wgrywania zdjęcia.'); } });
    const productMutation = useMutation({ mutationFn: createProduct, onSuccess: async (newProduct) => { if (productImageFile) { await imageMutation.mutateAsync({ productId: newProduct.id, file: productImageFile }); } queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produkt dodany!'); setIsProductDialogOpen(false); setProductForm({ name: '', description: '', categoryIds: [] }); setProductImageFile(null); }, onError: (error) => { console.error(error); toast.error('Błąd dodawania produktu.'); } });
    const productUpdateMutation = useMutation({ mutationFn: updateProduct, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produkt zaktualizowany!'); setIsEditDialogOpen(false); }, onError: (error) => { console.error(error); toast.error('Błąd aktualizacji produktu.'); } });
    const productDeleteMutation = useMutation({ mutationFn: deleteProduct, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Produkt został usunięty!'); setIsEditDialogOpen(false); }, onError: (error) => { console.error(error); toast.error('Błąd usuwania produktu.'); } });
    const variantMutation = useMutation({ mutationFn: addVariant, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Wariant dodany!'); setIsVariantDialogOpen(false); }, onError: (error) => { console.error(error); toast.error('Błąd dodawania wariantu.'); } });
    const variantUpdateMutation = useMutation({ mutationFn: updateVariant, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Wariant zaktualizowany!'); setEditingVariant(null); }, onError: (error) => { console.error(error); toast.error('Błąd aktualizacji wariantu.'); } });
    const variantDeleteMutation = useMutation({ mutationFn: deleteVariant, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Wariant usunięty!'); setEditingVariant(null); }, onError: (error) => { console.error(error); toast.error('Błąd usuwania wariantu.'); } });
    const categoryMutation = useMutation({ mutationFn: createCategory, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Kategoria dodana!'); setNewCategoryName(''); }, onError: (error) => { console.error(error); toast.error('Błąd dodawania kategorii.'); } });

    const handleProductSubmit = (e: React.FormEvent) => { e.preventDefault(); productMutation.mutate(productForm); };
    const handleVariantSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!selectedProduct) return; variantMutation.mutate({ productId: selectedProduct.id, ...variantForm, price: Math.round(variantForm.price * 100) }); };
    const handleCategorySubmit = (e: React.FormEvent) => { e.preventDefault(); categoryMutation.mutate(newCategoryName); };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file && selectedProduct) { imageMutation.mutate({ productId: selectedProduct.id, file }); } };
    const handleVariantUpdate = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (!editingVariant) return; const formData = new FormData(e.currentTarget); variantUpdateMutation.mutate({ variantId: editingVariant.id, quantity: Number(formData.get('quantity')), price: Math.round(Number(formData.get('price')) * 100) }); };
    const handleVariantDelete = () => { if (!editingVariant) return; variantDeleteMutation.mutate(editingVariant.id); };
    const handleProductDelete = () => { if (!selectedProduct) return; productDeleteMutation.mutate(selectedProduct.id); };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setEditProductForm({
            name: product.name,
            description: product.description || '',
            isActive: product.is_active,
            categoryIds: product.categories.map(c => c.id),
        });
        setIsEditDialogOpen(true);
    };

    const handleProductUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedProduct) return;
        productUpdateMutation.mutate({
            id: selectedProduct.id,
            name: editProductForm.name,
            description: editProductForm.description,
            isActive: editProductForm.isActive,
            categoryIds: editProductForm.categoryIds,
        });
    };

    return (
        <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <main className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Zarządzanie Produktami</h1>
                    <Button onClick={() => setIsProductDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Produkt</Button>
                </div>
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead className="w-[80px]">Zdjęcie</TableHead>
                                <TableHead>Nazwa</TableHead>
                                <TableHead>Kategorie</TableHead>
                                <TableHead>Warianty</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {isLoading && <TableRow><TableCell colSpan={6} className="text-center">Ładowanie...</TableCell></TableRow>}
                                {products?.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell><Image src={product.image_url || '/placeholder.svg'} alt={product.name} width={64} height={64} className="rounded-md object-cover bg-gray-100" /></TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {product.categories.map(cat => (
                                                    <Badge key={cat.id} variant="outline">{cat.name}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell><div className="flex flex-wrap gap-1">
                                            {product.product_variants.map(v => <Badge key={v.id} variant="secondary" className="cursor-pointer" onClick={() => setEditingVariant(v)}>{v.quantity} szt.</Badge>)}
                                        </div></TableCell>
                                        <TableCell><Badge variant={product.is_active ? 'default' : 'destructive'}>{product.is_active ? 'Aktywny' : 'Ukryty'}</Badge></TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => { setSelectedProduct(product); setIsVariantDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Wariant</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}><Edit className="mr-2 h-4 w-4" /> Edytuj</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
            <aside className="lg:col-span-1 sticky top-24">
                <Card>
                    <CardHeader><CardTitle>Kategorie Produktów</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
                            <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nazwa nowej kategorii" />
                            <Button type="submit" disabled={categoryMutation.isPending}>{categoryMutation.isPending ? '...' : 'Dodaj'}</Button>
                        </form>
                        <div className="space-y-2">
                            {categories?.map(cat => <Badge key={cat.id}>{cat.name}</Badge>)}
                        </div>
                    </CardContent>
                </Card>
            </aside>

            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Dodaj nowy produkt</DialogTitle></DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
                        <div><Label>Zdjęcie produktu (opcjonalnie)</Label><Input type="file" onChange={(e) => setProductImageFile(e.target.files?.[0] || null)} accept="image/png, image/jpeg, image/jpg" /></div>
                        <div><Label>Nazwa</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                        <div><Label>Opis</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                        <div><Label>Kategorie</Label>
                            <CategorySelector
                                allCategories={categories || []}
                                selectedIds={productForm.categoryIds}
                                onSelectionChange={(ids) => setProductForm(prev => ({ ...prev, categoryIds: ids }))}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={productMutation.isPending}>{productMutation.isPending ? 'Dodawanie...' : 'Dodaj Produkt'}</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Dodaj wariant do: {selectedProduct?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={handleVariantSubmit} className="space-y-4 pt-4">
                        <div><Label>Ilość (szt.)</Label><Input type="number" value={variantForm.quantity} onChange={e => setVariantForm({...variantForm, quantity: Number(e.target.value)})} /></div>
                        <div><Label>Cena (PLN)</Label><Input type="number" step="0.01" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: Number(e.target.value)})} /></div>
                        <Button type="submit" className="w-full" disabled={variantMutation.isPending}>{variantMutation.isPending ? 'Dodawanie...' : 'Dodaj Wariant'}</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edytuj produkt: {selectedProduct?.name}</DialogTitle></DialogHeader>
                    <form onSubmit={handleProductUpdate} className="space-y-4 pt-4">
                        <div className="flex justify-center">
                            <div className="relative group w-32 h-32">
                                <Image src={selectedProduct?.image_url || '/placeholder.svg'} alt={selectedProduct?.name || ''} layout="fill" className="rounded-md object-cover bg-gray-100" key={selectedProduct?.image_url} />
                                <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-md bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Upload className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                        </div>
                        <div><Label>Nazwa</Label><Input value={editProductForm.name} onChange={e => setEditProductForm(prev => ({ ...prev, name: e.target.value }))} /></div>
                        <div><Label>Opis</Label><Textarea value={editProductForm.description} onChange={e => setEditProductForm(prev => ({ ...prev, description: e.target.value }))} /></div>
                        <div className="flex items-center space-x-2"><Switch checked={editProductForm.isActive} onCheckedChange={c => setEditProductForm(prev => ({ ...prev, isActive: c }))} /><Label>Produkt aktywny</Label></div>
                        <div><Label>Kategorie</Label>
                            <CategorySelector
                                allCategories={categories || []}
                                selectedIds={editProductForm.categoryIds}
                                onSelectionChange={(ids) => setEditProductForm(prev => ({ ...prev, categoryIds: ids }))}
                            />
                        </div>
                        <div className="flex justify-between pt-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Usuń produkt
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno chcesz usunąć ten produkt?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tej akcji nie można cofnąć. Produkt zostanie zarchiwizowany i ukryty w sklepie.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleProductDelete} disabled={productDeleteMutation.isPending}>
                                            {productDeleteMutation.isPending ? 'Usuwanie...' : 'Tak, usuń'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button type="submit" disabled={productUpdateMutation.isPending}>
                                {productUpdateMutation.isPending ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingVariant} onOpenChange={(isOpen) => !isOpen && setEditingVariant(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edytuj wariant</DialogTitle></DialogHeader>
                    <form onSubmit={handleVariantUpdate} className="space-y-4 pt-4">
                        <div><Label>Ilość (szt.)</Label><Input name="quantity" type="number" defaultValue={editingVariant?.quantity} /></div>
                        <div><Label>Cena (PLN)</Label><Input name="price" type="number" step="0.01" defaultValue={(editingVariant?.price || 0) / 100} /></div>
                        <div className="flex justify-between pt-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Usuń wariant
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno chcesz usunąć ten wariant?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tej akcji nie można cofnąć. Wariant zostanie zarchiwizowany.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleVariantDelete} disabled={variantDeleteMutation.isPending}>
                                            {variantDeleteMutation.isPending ? 'Usuwanie...' : 'Tak, usuń'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <Button type="submit" disabled={variantUpdateMutation.isPending}>
                                {variantUpdateMutation.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CategorySelector({ allCategories, selectedIds, onSelectionChange }: { allCategories: Category[], selectedIds: string[], onSelectionChange: (ids: string[]) => void }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedIds.length > 0 ? `${selectedIds.length} zaznaczono` : "Wybierz kategorie..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Szukaj kategorii..." />
                    <CommandList>
                        <CommandEmpty>Brak kategorii.</CommandEmpty>
                        <CommandGroup>
                            {allCategories.map(cat => (
                                <CommandItem key={cat.id} value={cat.name} onSelect={() => {
                                    const isSelected = selectedIds.includes(cat.id);
                                    onSelectionChange(isSelected ? selectedIds.filter(id => id !== cat.id) : [...selectedIds, cat.id]);
                                }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedIds.includes(cat.id) ? "opacity-100" : "opacity-0")} />
                                    {cat.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
