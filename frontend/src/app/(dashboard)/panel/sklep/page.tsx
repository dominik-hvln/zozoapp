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
        <Card className="flex flex-col md:flex-row p-4">
            <CardHeader className="p-0 w-full md:w-30 md:min-w-30">
                <Image
                    src={product.image_url || AppleIcon}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="w-full h-30 md:h-48 object-contain rounded-t-lg"
                />
            </CardHeader>
            <CardContent className="p-0 flex flex-col flex-grow">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="text-xs mt-1">{product.description}</CardDescription>
                <div className="mt-4 flex-grow">
                    <p className="text-xs text-muted-foreground mb-2">Wybierz ilość:</p>
                    <ToggleGroup
                        type="single"
                        value={selectedVariantId}
                        onValueChange={(value) => { if (value) setSelectedVariantId(value) }}
                        className="justify-start gap-2"
                    >
                        {product.product_variants.map(variant => (
                            <ToggleGroupItem key={variant.id} value={variant.id} className="text-xs h-8 px-3 product_qty">
                                {variant.quantity} szt.
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-2xl text-[#466EC6] font-bold">{(selectedVariant?.price || 0) / 100} zł</p>
                    <Button onClick={handleAddToCart} size="lg" className="bg-orange-400 hover:bg-orange-500 rounded-[22px] py-3 px-4">
                        <ShoppingCart className="mr-2 h-4 w-4" /> Dodaj do koszyka
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// --- GŁÓWNY KOMPONENT STRONY SKLEPU ---
export default function SklepPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');
    const [viewMode, setViewMode] = useState('grid');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const { data: products, isLoading, error } = useQuery({
        queryKey: ['store-products', debouncedSearchTerm, sortBy],
        queryFn: () => getProducts(debouncedSearchTerm, sortBy),
    });

    return (
        <Card>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                    <aside className="lg:col-span-1 sticky">
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

                    <main className="lg:col-span-3">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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