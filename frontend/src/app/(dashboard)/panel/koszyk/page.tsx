'use client';

import { useCartStore } from '@/store/cart.store';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { StaticImageData } from 'next/image';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';
import { ShippingSelector } from '@/components/cart/ShippingSelector';

const shippingAddressSchema = z.object({
    firstName: z.string()
        .min(2, 'Imię musi mieć minimum 2 znaki')
        .max(50, 'Imię może mieć maksymalnie 50 znaków')
        .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, 'Imię może zawierać tylko litery, spacje i myślniki'),
    lastName: z.string()
        .min(2, 'Nazwisko musi mieć minimum 2 znaki')
        .max(50, 'Nazwisko może mieć maksymalnie 50 znaków')
        .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, 'Nazwisko może zawierać tylko litery, spacje i myślniki'),
    street: z.string()
        .min(5, 'Adres musi mieć minimum 5 znaków')
        .max(100, 'Adres może mieć maksymalnie 100 znaków')
        .refine(val => val.trim().length >= 5, 'Adres nie może składać się tylko ze spacji'),
    city: z.string()
        .min(2, 'Miasto musi mieć minimum 2 znaki')
        .max(50, 'Miasto może mieć maksymalnie 50 znaków')
        .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, 'Miasto może zawierać tylko litery, spacje i myślniki'),
    postalCode: z.string()
        .regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX (np. 00-000)')
        .refine(val => val !== '00-000', 'Wprowadź prawidłowy kod pocztowy'),
    phoneNumber: z.string()
        .optional()
        .or(z.string()
            .min(1, 'Numer telefonu nie może być pusty')
            .max(15, 'Numer telefonu może mieć maksymalnie 15 cyfr')
            .regex(/^(\+48\s?)?[\d\s()-]{9,15}$/, 'Numer telefonu musi być w formacie polskim')
            .refine(val => {
                if (!val || val.trim() === '') return true; // Opcjonalne pole
                const digitsOnly = val.replace(/\D/g, '');
                return digitsOnly.length >= 9 && digitsOnly.length <= 11;
            }, 'Numer telefonu musi zawierać 9-11 cyfr')
            .refine(val => {
                if (!val || val.trim() === '') return true;
                const digitsOnly = val.replace(/\D/g, '');
                if (digitsOnly.startsWith('48')) {
                    return digitsOnly.length === 11; // +48 + 9 cyfr
                } else if (!digitsOnly.startsWith('48')) {
                    return digitsOnly.length === 9; // lokalne 9 cyfr
                }
                return true;
            }, 'Nieprawidłowy format numeru telefonu dla Polski')
        ),
});

type AppliedDiscount = { code: string; discount: { type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number } };
type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export default function KoszykPage() {
    const { items, removeItem, updateItemQuantity, clearCart } = useCartStore();
    const [promoCode, setPromoCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

    const [selectedShipping, setSelectedShipping] = useState<{
        id: string;
        price: number;
    } | null>(null);

    const form = useForm<ShippingAddress>({
        resolver: zodResolver(shippingAddressSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            street: '',
            city: '',
            postalCode: '',
            phoneNumber: '',
        }
    });

    const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
    const shippingCost = selectedShipping?.price ?? 0;
    const discountAmount = useMemo(() => {
        if (!appliedDiscount) return 0;
        if (appliedDiscount.discount.type === 'PERCENTAGE') {
            return (subtotal * appliedDiscount.discount.value) / 100;
        } else {
            return appliedDiscount.discount.value;
        }
    }, [appliedDiscount, subtotal]);
    const total = subtotal + shippingCost - discountAmount;

    const checkoutMutation = useMutation({
        mutationFn: (data: {
            items: { priceId: string, quantity: number }[],
            couponCode?: string,
            shippingMethodId: string,
            shippingAddress: ShippingAddress
        }) => {
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

    const promoMutation = useMutation({
        mutationFn: (code: string) => {
            const trimmedCode = code.trim().toUpperCase();
            if (trimmedCode.length < 3) {
                throw new Error('Kod promocyjny musi mieć minimum 3 znaki');
            }
            if (trimmedCode.length > 20) {
                throw new Error('Kod promocyjny może mieć maksymalnie 20 znaków');
            }
            if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
                throw new Error('Kod promocyjny może zawierać tylko litery i cyfry');
            }
            return api.post('/store/validate-promo', { code: trimmedCode });
        },
        onSuccess: (response) => {
            setAppliedDiscount(response.data);
            setPromoCode('');
            toast.success(`Kod rabatowy "${response.data.code}" został pomyślnie zastosowany!`);
        },
        onError: (error: unknown) => {
            let message = 'Wystąpił błąd podczas sprawdzania kodu rabatowego.';

            if (error instanceof AxiosError) {
                message = error.response?.data?.message || error.message || message;
            } else if (error instanceof Error) {
                message = error.message;
            }

            toast.error('Błąd kodu rabatowego', { description: message });
        },
    });

    const handleApplyPromo = () => {
        const trimmedCode = promoCode.trim();
        if (!trimmedCode) {
            toast.error('Wprowadź kod promocyjny');
            return;
        }
        if (appliedDiscount) {
            toast.error('Kod rabatowy jest już zastosowany. Usuń obecny kod, aby dodać nowy.');
            return;
        }
        promoMutation.mutate(trimmedCode);
    };

    const handleRemovePromo = () => {
        setAppliedDiscount(null);
        setPromoCode('');
        toast.success('Kod rabatowy został usunięty');
    };

    const handleCheckout = (data: ShippingAddress) => {
        if (items.length === 0) {
            toast.error('Koszyk jest pusty');
            return;
        }
        if (!selectedShipping) {
            toast.error('Wybierz metodę dostawy');
            return;
        }
        const invalidItems = items.filter(item => item.quantity <= 0 || item.quantity > 999);
        if (invalidItems.length > 0) {
            toast.error('Sprawdź ilości produktów w koszyku');
            return;
        }

        const itemsForCheckout = items.map(item => ({
            priceId: item.stripePriceId,
            quantity: item.quantity
        }));

        const checkoutData = {
            items: itemsForCheckout,
            couponCode: appliedDiscount?.code,
            shippingMethodId: selectedShipping.id,
            shippingAddress: {
                ...data,
            }
        };

        checkoutMutation.mutate(checkoutData);
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Twój koszyk</h1>
            {items.length === 0 ? (
                <Card className="text-center p-8"><CardContent><p>Twój koszyk jest pusty.</p></CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader><CardTitle>Produkty w koszyku</CardTitle></CardHeader>
                            <CardContent className="px-6 py-0">
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
                                                <TableCell><Image src={item.image_url || LemonIcon} alt={item.name} width={64} height={64} className='p-2' /></TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="999"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const newQuantity = parseInt(e.target.value);
                                                                if (isNaN(newQuantity) || newQuantity < 1) {
                                                                    updateItemQuantity(item.id, 1);
                                                                    toast.error('Minimalna ilość to 1');
                                                                } else if (newQuantity > 999) {
                                                                    updateItemQuantity(item.id, 999);
                                                                    toast.error('Maksymalna ilość to 999');
                                                                } else {
                                                                    updateItemQuantity(item.id, newQuantity);
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                const value = parseInt(e.target.value);
                                                                if (isNaN(value) || value < 1) {
                                                                    updateItemQuantity(item.id, 1);
                                                                }
                                                            }}
                                                            className="w-20"
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
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
                        <Card>
                            <CardHeader><CardTitle>Adres Dostawy</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className='grid gap-2'>
                                        <Label htmlFor="firstName">Imię</Label>
                                        <Input
                                            id="firstName"
                                            {...form.register('firstName')}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const filteredValue = value.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '');
                                                if (filteredValue !== value) {
                                                    e.target.value = filteredValue;
                                                }
                                                form.setValue('firstName', filteredValue, { shouldValidate: true });
                                                form.trigger('firstName');
                                            }}
                                            maxLength={50}
                                            className={form.formState.errors.firstName ? 'border-red-500' : ''}
                                        />
                                        {form.formState.errors.firstName && (
                                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.firstName.message}</p>
                                        )}
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label htmlFor="lastName">Nazwisko</Label>
                                        <Input
                                            id="lastName"
                                            {...form.register('lastName')}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const filteredValue = value.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '');
                                                if (filteredValue !== value) {
                                                    e.target.value = filteredValue;
                                                }
                                                form.setValue('lastName', filteredValue, { shouldValidate: true });
                                                form.trigger('lastName');
                                            }}
                                            maxLength={50}
                                            className={form.formState.errors.lastName ? 'border-red-500' : ''}
                                        />
                                        {form.formState.errors.lastName && (
                                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.lastName.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className='grid gap-2'>
                                    <Label htmlFor="street">Ulica i numer</Label>
                                    <Input
                                        id="street"
                                        {...form.register('street')}
                                        onChange={(e) => {
                                            const value = e.target.value.trimStart();
                                            e.target.value = value;
                                            form.setValue('street', value, { shouldValidate: true });
                                            form.trigger('street');
                                        }}
                                        maxLength={100}
                                        className={form.formState.errors.street ? 'border-red-500' : ''}
                                    />
                                    {form.formState.errors.street && (
                                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.street.message}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className='grid gap-2'>
                                        <Label htmlFor="postalCode">Kod pocztowy</Label>
                                        <Input
                                            id="postalCode"
                                            {...form.register('postalCode')}
                                            placeholder="00-000"
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, ''); // Usuń wszystko oprócz cyfr

                                                if (value.length >= 2) {
                                                    value = value.slice(0, 2) + '-' + value.slice(2, 5);
                                                }

                                                e.target.value = value;
                                                form.setValue('postalCode', value, { shouldValidate: true });
                                                form.trigger('postalCode'); // Wywołaj walidację
                                            }}
                                            onKeyDown={(e) => {
                                                if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                                    return;
                                                }
                                                if (!/\d/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            maxLength={6}
                                            className={form.formState.errors.postalCode ? 'border-red-500' : ''}
                                        />
                                        {form.formState.errors.postalCode && (
                                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.postalCode.message}</p>
                                        )}
                                    </div>
                                    <div className='grid gap-2'>
                                        <Label htmlFor="city">Miasto</Label>
                                        <Input
                                            id="city"
                                            {...form.register('city')}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const filteredValue = value.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]/g, '');
                                                if (filteredValue !== value) {
                                                    e.target.value = filteredValue;
                                                }
                                                form.setValue('city', filteredValue, { shouldValidate: true });
                                                form.trigger('city');
                                            }}
                                            maxLength={50}
                                            className={form.formState.errors.city ? 'border-red-500' : ''}
                                        />
                                        {form.formState.errors.city && (
                                            <p className="text-red-500 text-sm mt-1">{form.formState.errors.city.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className='grid gap-2'>
                                    <Label htmlFor="phoneNumber">Numer telefonu (opcjonalnie)</Label>
                                    <Input
                                        id="phoneNumber"
                                        type="tel"
                                        {...form.register('phoneNumber')}
                                        placeholder="+48 123 456 789"
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            value = value.replace(/[^\d\s+()-]/g, '');
                                            const digitsOnly = value.replace(/\D/g, '');
                                            if (digitsOnly.length === 9 && !value.includes('+48')) {
                                                value = `+48 ${digitsOnly.slice(0,3)} ${digitsOnly.slice(3,6)} ${digitsOnly.slice(6,9)}`;
                                            }
                                            else if (digitsOnly.startsWith('48') && digitsOnly.length === 11) {
                                                const phoneDigits = digitsOnly.slice(2);
                                                value = `+48 ${phoneDigits.slice(0,3)} ${phoneDigits.slice(3,6)} ${phoneDigits.slice(6,9)}`;
                                            }
                                            else if (digitsOnly.length > 0 && !value.includes('+48')) {
                                                if (digitsOnly.length <= 3) {
                                                    value = digitsOnly;
                                                } else if (digitsOnly.length <= 6) {
                                                    value = `${digitsOnly.slice(0,3)} ${digitsOnly.slice(3)}`;
                                                } else if (digitsOnly.length <= 9) {
                                                    value = `${digitsOnly.slice(0,3)} ${digitsOnly.slice(3,6)} ${digitsOnly.slice(6)}`;
                                                }
                                            }

                                            e.target.value = value;
                                            form.setValue('phoneNumber', value, { shouldValidate: true });
                                            form.trigger('phoneNumber');
                                        }}
                                        onKeyDown={(e) => {
                                            if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                                                return;
                                            }
                                            if (!/[\d\s+()-]/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                            const currentLength = (e.target as HTMLInputElement).value.replace(/\D/g, '').length;
                                            if (currentLength >= 11 && /\d/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const value = e.target.value;
                                            const digitsOnly = value.replace(/\D/g, '');
                                            if (digitsOnly.length > 0 && digitsOnly.length < 9) {
                                                form.setError('phoneNumber', {
                                                    type: 'manual',
                                                    message: `Numer telefonu jest za krótki (${digitsOnly.length}/9 cyfr)`
                                                });
                                            } else if (digitsOnly.length > 11) {
                                                form.setError('phoneNumber', {
                                                    type: 'manual',
                                                    message: 'Numer telefonu jest za długi'
                                                });
                                            } else {
                                                form.clearErrors('phoneNumber');
                                            }

                                            form.trigger('phoneNumber');
                                        }}
                                        maxLength={15}
                                        className={form.formState.errors.phoneNumber ? 'border-red-500' : ''}
                                    />
                                    {form.formState.errors.phoneNumber && (
                                        <p className="text-red-500 text-sm mt-1">{form.formState.errors.phoneNumber.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-lg">
                            <CardHeader><CardTitle>Podsumowanie</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between"><span>Suma produktów:</span><span>{(subtotal / 100).toFixed(2)} zł</span></div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Kod promocyjny (np. SAVE20)"
                                        value={promoCode}
                                        onChange={(e) => {
                                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                            if (value.length <= 20) {
                                                setPromoCode(value);
                                            }
                                        }}
                                        disabled={!!appliedDiscount}
                                        maxLength={20}
                                    />
                                    {appliedDiscount ? (
                                        <Button
                                            variant="outline"
                                            onClick={handleRemovePromo}
                                            className="whitespace-nowrap"
                                        >
                                            Usuń kod
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={handleApplyPromo}
                                            disabled={promoMutation.isPending || !promoCode.trim()}
                                            className="whitespace-nowrap"
                                        >
                                            {promoMutation.isPending ? 'Sprawdzam...' : 'Zastosuj'}
                                        </Button>
                                    )}
                                </div>
                                {appliedDiscount && (<div className="flex justify-between text-green-600"><span>Rabat ({appliedDiscount.code}):</span><span>-{(discountAmount / 100).toFixed(2)} zł</span></div>)}
                                <ShippingSelector
                                    selectedId={selectedShipping?.id ?? null}
                                    onChange={(id, price) =>
                                        setSelectedShipping({ id, price })
                                    }
                                />
                                <Separator />
                                <div className="flex justify-between font-bold text-xl"><span>Razem:</span><span>{(total / 100).toFixed(2)} zł</span></div>
                                <Button onClick={() => form.handleSubmit(handleCheckout)()} disabled={items.length === 0 || checkoutMutation.isPending} className="w-full bg-orange-400 hover:bg-orange-500 rounded-[22px] py-3 px-4" size="lg">
                                    {checkoutMutation.isPending ? 'Przetwarzanie...' : 'Kupuję i płacę'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}