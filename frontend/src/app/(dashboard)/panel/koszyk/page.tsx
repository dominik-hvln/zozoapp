'use client';

import { useCartStore } from '@/store/cart.store';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Import komponentów
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';

// Import awatarów - dostosuj do swoich plików
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';

const productImages: { [key: string]: any } = {
    'Zestaw 5 Tatuaży ZozoApp': AppleIcon, // Przykładowe mapowanie nazwy na obrazek
    'Inny Produkt': LemonIcon,
};


export default function KoszykPage() {
    const { items, removeItem, updateItemQuantity, clearCart } = useCartStore();

    // --- Logika Obliczeń ---
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 10000 ? 0 : 999; // Darmowa dostawa powyżej 100 zł
    const total = subtotal + shippingCost;
    const amountToFreeShipping = 10000 - subtotal;

    // --- Logika Płatności ---
    const checkoutMutation = useMutation({
        mutationFn: (cartItems: { priceId: string, quantity: number }[]) => api.post('/store/checkout/payment', { items: cartItems }),
        onSuccess: (response) => {
            clearCart();
            window.location.href = response.data.url;
        },
        onError: () => toast.error('Wystąpił błąd podczas przechodzenia do płatności.'),
    });

    const handleCheckout = () => {
        const itemsToCheckout = items.map(item => ({
            priceId: item.stripePriceId,
            quantity: item.quantity,
        }));
        checkoutMutation.mutate(itemsToCheckout);
    };

    return (
        <div className="p-4 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Twój Koszyk ({items.length})</h1>
            {items.length === 0 ? (
                <p>Twój koszyk jest pusty.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Lewa kolumna: Lista produktów */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map(item => (
                            <Card key={item.id} className="flex flex-row items-center p-4 gap-4">
                                <Image src={productImages[item.name] || AppleIcon} alt={item.name} className="w-20 h-20" />
                                <div className="flex-1">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">Tatuaż z serii "Owoce", trwałość do 5 dni.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Select
                                        value={String(item.quantity)}
                                        onValueChange={(value) => updateItemQuantity(item.id, Number(value))}
                                    >
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...Array(10).keys()].map(i => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <p className="font-semibold w-24 text-right">{(item.price * item.quantity / 100).toFixed(2)} zł</p>
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Prawa kolumna: Podsumowanie */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader><CardTitle>Podsumowanie zamówienia</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span>Suma produktów:</span>
                                    <span>{(subtotal / 100).toFixed(2)} zł</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Koszt dostawy:</span>
                                    <span>{(shippingCost / 100).toFixed(2)} zł</span>
                                </div>
                                {amountToFreeShipping > 0 && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Do darmowej dostawy brakuje {(amountToFreeShipping / 100).toFixed(2)} zł
                                    </p>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Razem do zapłaty:</span>
                                    <span>{(total / 100).toFixed(2)} zł</span>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="rabat" className="text-xs">Kod rabatowy</Label>
                                    <div className="flex gap-2">
                                        <Input id="rabat" placeholder="Wprowadź kod" />
                                        <Button variant="outline">Zastosuj</Button>
                                    </div>
                                </div>
                                <Button onClick={handleCheckout} disabled={checkoutMutation.isPending} className="w-full">
                                    {checkoutMutation.isPending ? 'Przetwarzanie...' : 'Przejdź do kasy'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}