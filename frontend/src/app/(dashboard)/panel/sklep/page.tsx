'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
}

const getProducts = async (): Promise<Product[]> => {
    const response = await api.get('/store/products');
    return response.data;
};

export default function SklepPage() {
    const { data: products, isLoading, error } = useQuery({
        queryKey: ['store-products'],
        queryFn: getProducts,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Sklep</h1>
                <p className="text-muted-foreground">Kup pakiety tatuaży, aby zapewnić bezpieczeństwo swoim dzieciom.</p>
            </div>

            {isLoading ? (
                <p>Ładowanie produktów...</p>
            ) : error ? (
                <p className="text-red-500">Nie udało się załadować produktów. Spróbuj ponownie później.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products?.map((product) => (
                        <Card key={product.id}>
                            <CardHeader>
                                <CardTitle>{product.name}</CardTitle>
                                {product.description && <CardDescription>{product.description}</CardDescription>}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-bold">{(product.price / 100).toFixed(2)} zł</p>
                                    <Button>
                                        <ShoppingCart className="mr-2 h-4 w-4" /> Kup Teraz
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}