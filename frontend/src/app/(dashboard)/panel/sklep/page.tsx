'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { toast } from 'sonner';
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import Image, { StaticImageData } from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Search, List, LayoutGrid } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import AppleIcon from '@/assets/avatars/apple.svg';

const productImages: { [key: string]: StaticImageData } = {
    'Zestaw Tatuaży ZozoApp': AppleIcon,
};

interface ProductVariant {
    id: string;
    quantity: number;
    price: number;
    stripe_price_id: string;
}
interface Product {
    image_url: string;
    id: string;
    name: string;
    description: string | null;
    product_variants: ProductVariant[];
}

const getProducts = async (searchTerm: string, sortBy: string): Promise<Product[]> => {
    const [sortField, sortOrder] = sortBy.split('-');
    const response = await api.get('/store/products', {
        params: { search: searchTerm, sortBy: sortField, sortOrder },
    });
    return response.data;
};

function ProductCard({ product }: { product: Product }) {
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(product.product_variants[0]?.id);
    const addItemToCart = useCartStore((state) => state.addItem);
    const selectedVariant = product.product_variants.find(v => v.id === selectedVariantId);

    const handleAddToCart = () => {
        if (!selectedVariant) {
            toast.error('Wybierz wariant produktu.');
            return;
        }
        addItemToCart({
            id: selectedVariant.id,
            name: `${product.name} (${selectedVariant.quantity} szt.)`,
            price: selectedVariant.price,
            stripePriceId: selectedVariant.stripe_price_id,
            image_url: product.image_url,
        });
        toast.success(`Dodano do koszyka: ${product.name} (${selectedVariant.quantity} szt.)`);
    }

    return (
        <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:gap-6">
            <CardHeader className="p-0 w-full shrink-0 lg:w-36 lg:min-w-36">
                <Image
                    src={product.image_url || AppleIcon}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="mx-auto h-32 w-full max-w-[220px] object-contain sm:h-40 lg:h-44"
                />
            </CardHeader>
            <CardContent className="flex min-w-0 flex-1 flex-col p-0">
                <CardTitle className="text-lg leading-snug">{product.name}</CardTitle>
                <CardDescription className="mt-1 text-xs">{product.description}</CardDescription>
                <div className="mt-4 flex-grow">
                    <p className="text-xs text-muted-foreground mb-2">Wybierz ilość:</p>
                    <ToggleGroup
                        type="single"
                        value={selectedVariantId}
                        onValueChange={(value) => { if (value) setSelectedVariantId(value) }}
                        className="flex flex-wrap justify-start gap-2"
                    >
                        {product.product_variants.map(variant => (
                            <ToggleGroupItem key={variant.id} value={variant.id} className="text-xs h-8 px-3 product_qty">
                                {variant.quantity} szt.
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-2xl font-bold text-[#466EC6]">{(selectedVariant?.price || 0) / 100} zł</p>
                    <Button onClick={handleAddToCart} size="lg" className="w-full shrink-0 rounded-[22px] bg-orange-400 px-4 py-3 hover:bg-orange-500 sm:w-auto">
                        <ShoppingCart className="mr-2 h-4 w-4" /> Dodaj do koszyka
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// --- GŁÓWNY KOMPONENT STRONY SKLEPU ---
export function SklepPageContent() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [viewMode, setViewMode] = useState('grid');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const { data: products, isLoading, error } = useQuery({
        queryKey: ['store-products', debouncedSearchTerm, sortBy],
        queryFn: () => getProducts(debouncedSearchTerm, sortBy),
    });

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 items-start gap-6 md:gap-8 lg:grid-cols-4">
                    <aside className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
                        <ToggleGroup className="mb-6" type="single" value={viewMode} onValueChange={(value) => { if(value) setViewMode(value) }}>
                            <ToggleGroupItem value="grid"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
                            <ToggleGroupItem value="list"><List className="h-4 w-4" /></ToggleGroupItem>
                        </ToggleGroup>
                        <Card>
                            <CardHeader><CardTitle>Filtry</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Kategorie (wkrótce)</Label>
                                    <div className="flex items-center space-x-2 opacity-50">
                                        <Checkbox id="seria-owoce" disabled /><Label htmlFor="seria-owoce" className="font-normal">Seria Owoce</Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    <main className="min-w-0 lg:col-span-3">
                        <div className="mb-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="relative w-full sm:max-w-xs">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Szukaj produktów..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">Sortuj: Nazwa A-Z</SelectItem>
                                        <SelectItem value="name-desc">Sortuj: Nazwa Z-A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isLoading ? <p>Ładowanie...</p> : error ? <p>Błąd.</p> : (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-2">
                                    {products?.map((product) => <ProductCard key={product.id} product={product} />)}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {products?.map((product) => <ProductCard key={product.id} product={product} />)}
                                </div>
                            )
                        )}
                    </main>
                </div>
            </CardContent>
        </Card>
    );
}

export default function SklepPage() {
    return <SklepPageContent />;
}