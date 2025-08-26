'use client';

import { useCartStore } from '@/store/cart.store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { StaticImageData } from 'next/image';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';

// Import komponentu do wyboru dostawy
import { ShippingSelector } from '@/components/cart/ShippingSelector';

// --- PRZYWRÓCONA, ORYGINALNA DEFINICJA TYPU Z TWOJEGO KODU ---
interface AppliedDiscount {
    code: string;
    discount: {
        type: 'PERCENTAGE' | 'FIXED_AMOUNT';
        value: number;
    }
}

// Mapowanie ikon produktów
const productIcons: { [key: string]: StaticImageData } = {
    'Apple': AppleIcon,
    'Lemon': LemonIcon,
};

export default function KoszykPage() {
    const { items, removeItem, updateItemQuantity, clearCart } = useCartStore();
    const [promoCode, setPromoCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

    // Przechowuje ID i cenę wybranej metody dostawy
    const [selectedShipping, setSelectedShipping] = useState<{ id: string; price: number } | null>(null);

    // Obliczenie sumy częściowej za produkty
    const subtotal = useMemo(
        () => items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
        [items]
    );

    // Koszt dostawy na podstawie wybranej opcji, domyślnie 0
    const shippingCost = selectedShipping?.price ?? 0;

    // --- PRZYWRÓCONA, ORYGINALNA LOGIKA OBLICZANIA RABATU Z TWOJEGO KODU ---
    const discountAmount = useMemo(() => {
        if (!appliedDiscount) return 0;
        if (appliedDiscount.discount.type === 'PERCENTAGE') {
            return (subtotal * appliedDiscount.discount.value) / 100;
        } else {
            return appliedDiscount.discount.value;
        }
    }, [appliedDiscount, subtotal]);

    // Obliczenie sumy całkowitej
    const total = subtotal + shippingCost - discountAmount;

    // Mutacja do tworzenia sesji płatności
    const checkoutMutation = useMutation({
        mutationFn: (data: { items: { priceId: string, quantity: number }[], couponCode?: string, shippingMethodId: string }) => {
            const platform = Capacitor.isNativePlatform() ? 'mobile' : 'web';
            return api.post('/store/checkout/payment', { ...data, platform });
        },
        onSuccess: async (response) => {
            const { url } = response.data;
            clearCart();
            toast.success('Przekierowuję do płatności...');
            if (Capacitor.isNativePlatform()) {
                await Browser.open({ url });
            } else {
                window.location.href = url;
            }
        },
        onError: () => {
            toast.error('Wystąpił błąd podczas przechodzenia do płatności.');
        },
    });

    // --- PRZYWRÓCONA, ORYGINALNA MUTACJA DLA KODU RABATOWEGO Z TWOJEGO KODU ---
    const promoMutation = useMutation({
        mutationFn: (code: string) => api.post('/store/validate-promo', { code }),
        onSuccess: (response) => {
            setAppliedDiscount(response.data);
            toast.success(`Kod rabatowy "${response.data.code}" został pomyślnie zastosowany!`);
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message: string })?.message || 'Wystąpił błąd.';
            toast.error('Błąd kodu rabatowego', { description: errorMessage });
        }
    });

    const handleApplyPromoCode = () => {
        if (!promoCode) return;
        promoMutation.mutate(promoCode);
    };

    // Obsługa przejścia do płatności
    const handleCheckout = () => {
        if (!selectedShipping) {
            toast.error('Proszę wybrać metodę dostawy.');
            return;
        }

        const itemsToCheckout = items.map(item => ({
            priceId: item.stripePriceId,
            quantity: item.quantity,
        }));

        checkoutMutation.mutate({
            items: itemsToCheckout,
            couponCode: appliedDiscount?.code,
            shippingMethodId: selectedShipping.id,
        });
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Twój koszyk</h1>
            {items.length === 0 ? (
                <Card className="text-center p-8">
                    <CardContent>
                        <p className="text-lg text-gray-500">Twój koszyk jest pusty.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Produkt</TableHead>
                                            <TableHead>Nazwa</TableHead>
                                            <TableHead>Ilość</TableHead>
                                            <TableHead>Cena</TableHead>
                                            <TableHead className="text-right">Suma</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Image src={productIcons[item.name] || LemonIcon} alt={item.name} width={64} height={64} className="rounded-md" />
                                                </TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value, 10))}
                                                            className="w-20"
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{(item.price / 100).toFixed(2)} zł</TableCell>
                                                <TableCell className="text-right">{(item.price * item.quantity / 100).toFixed(2)} zł</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-lg">
                            <CardHeader>
                                <CardTitle>Podsumowanie zamówienia</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span>Suma produktów:</span>
                                    <span>{(subtotal / 100).toFixed(2)} zł</span>
                                </div>

                                <div className="flex items-end gap-2">
                                    <div className="flex-grow">
                                        <Label htmlFor="promo">Kod promocyjny</Label>
                                        <Input id="promo" placeholder="Wpisz kod" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                    </div>
                                    <Button onClick={handleApplyPromoCode} disabled={promoMutation.isPending}>
                                        {promoMutation.isPending ? 'Sprawdzam...' : 'Zastosuj'}
                                    </Button>
                                </div>

                                {/* DOSTOSOWANE WYŚWIETLANIE NAZWY RABATU */}
                                {appliedDiscount && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Zastosowano rabat ({appliedDiscount.code}):</span>
                                        <span>-{(discountAmount / 100).toFixed(2)} zł</span>
                                    </div>
                                )}

                                <ShippingSelector
                                    selectedId={selectedShipping?.id ?? null}
                                    onChange={(id, price) => setSelectedShipping({ id, price })}
                                />

                                <Separator />

                                <div className="flex justify-between font-bold text-xl">
                                    <span>Razem do zapłaty:</span>
                                    <span>{(total / 100).toFixed(2)} zł</span>
                                </div>

                                <Button
                                    onClick={handleCheckout}
                                    disabled={items.length === 0 || checkoutMutation.isPending}
                                    className="w-full mt-4"
                                    size="lg"
                                >
                                    {checkoutMutation.isPending ? 'Przetwarzanie...' : 'Przejdź do płatności'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
