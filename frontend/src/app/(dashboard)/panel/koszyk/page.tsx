'use client';

import { useCartStore } from '@/store/cart.store';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { StaticImageData } from 'next/image';
import Image from 'next/image';
import { useState } from 'react';
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

const productImages: { [key: string]: StaticImageData } = {
    'Zestaw 5 Tatuaży ZozoApp': AppleIcon,
    'Inny Produkt': LemonIcon,
};


export default function KoszykPage() {
    const { items, removeItem, updateItemQuantity, clearCart } = useCartStore();
    const [promoCode, setPromoCode] = useState('');

    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingCost = subtotal > 10000 ? 0 : 999;
    const total = subtotal + shippingCost;
    const amountToFreeShipping = 10000 - subtotal;

    const checkoutMutation = useMutation({
        mutationFn: (cartItems: { priceId: string, quantity: number }[]) => {
            const platform = Capacitor.isNativePlatform() ? 'mobile' : 'web';
            return api.post('/store/checkout/payment', { items: cartItems, platform });
        },
        onSuccess: async (response) => {
            const { url } = response.data;
            clearCart();
            if (Capacitor.isNativePlatform()) {
                await Browser.open({ url });
            } else {
                window.location.href = url;
            }
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

    const handleApplyPromoCode = () => {
        toast.info('Funkcjonalność kodów rabatowych jest w trakcie przygotowania.');
    };

    return (
        <Card className="p-4">
            <CardContent className="px-0">
                <div>
                    <h1 className="text-3xl font-bold mb-6">Twój Koszyk ({items.length})</h1>
                    {items.length === 0 ? (
                        <p>Twój koszyk jest pusty.</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Lewa kolumna: Tabela z produktami */}
                            <div className="lg:col-span-2">
                                <Card className="shadow-sm">
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[100px]">Produkt</TableHead>
                                                    <TableHead>Opis</TableHead>
                                                    <TableHead className="text-center">Ilość</TableHead>
                                                    <TableHead className="text-right">Cena</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <Image src={productImages[item.name] || AppleIcon} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <p className="font-semibold">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">Trwałość do 5 dni</p>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Select
                                                                value={String(item.quantity)}
                                                                onValueChange={(value) => updateItemQuantity(item.id, Number(value))}
                                                            >
                                                                <SelectTrigger className="w-20 mx-auto">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {[...Array(10).keys()].map(i => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="font-semibold text-right">
                                                            {(item.price * item.quantity / 100).toFixed(2)} zł
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Prawa kolumna: Podsumowanie */}
                            <div className="lg:col-span-1 sticky top-24">
                                <Card className="shadow-sm">
                                    <CardHeader><CardTitle>Podsumowanie zamówienia</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Suma produktów:</span>
                                            <span>{(subtotal / 100).toFixed(2)} zł</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Koszt dostawy:</span>
                                            <span>{(shippingCost / 100).toFixed(2)} zł</span>
                                        </div>
                                        {amountToFreeShipping > 0 && (
                                            <p className="text-xs text-center text-muted-foreground bg-gray-50 p-2 rounded-md">
                                                Do darmowej dostawy brakuje {(amountToFreeShipping / 100).toFixed(2)} zł
                                            </p>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Razem do zapłaty:</span>
                                            <span>{(total / 100).toFixed(2)} zł</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-right">Czas realizacji: 2-3 dni robocze</p>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label htmlFor="rabat" className="text-xs font-semibold">Kod rabatowy</Label>
                                            <div className="flex gap-2">
                                                <Input id="rabat" placeholder="Wprowadź kod" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                                <Button variant="outline" onClick={handleApplyPromoCode}>Zastosuj</Button>
                                            </div>
                                        </div>
                                        <Button onClick={handleCheckout} disabled={checkoutMutation.isPending} className="w-full bg-[#FFA800] hover:bg-orange-400 h-12 text-base font-bold rounded-2xl">
                                            {checkoutMutation.isPending ? 'Przetwarzanie...' : 'Przejdź do kasy'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}