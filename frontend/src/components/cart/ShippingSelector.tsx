'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export type ShippingMethod = {
    id: string;
    name: string;
    price: number;       // grosze
    is_active: boolean;
};

type Props = {
    selectedId: string | null;
    onChange: (id: string, price: number) => void;
};

export function ShippingSelector({ selectedId, onChange }: Props) {
    const { data, isLoading } = useQuery({
        queryKey: ['store-shipping'],
        queryFn: async (): Promise<ShippingMethod[]> => (await api.get('/store/shipping')).data,
        staleTime: 60_000,
    });

    useEffect(() => {
        if (!data || !data.length) return;
        if (!selectedId) {
            const cheapest = [...data].sort((a, b) => a.price - b.price)[0];
            if (cheapest) onChange(cheapest.id, cheapest.price);
        }
    }, [data, onChange, selectedId]);

    if (isLoading) return <Skeleton className="h-10 w-full" />;

    if (!data?.length) {
        return <p className="text-sm text-muted-foreground">Brak dostępnych metod dostawy.</p>;
    }

    return (
        <div className="space-y-2">
            <Label>Metoda dostawy</Label>
            <RadioGroup
                value={selectedId ?? undefined}
                onValueChange={(id) => {
                    const m = data.find(x => x.id === id);
                    if (m) onChange(m.id, m.price);
                }}
                className="grid gap-2"
            >
                {data.map((m) => (
                    <label key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <RadioGroupItem id={`ship-${m.id}`} value={m.id} />
                            <span className="font-medium">{m.name}</span>
                        </div>
                        <span className="tabular-nums">{(m.price / 100).toFixed(2)} zł</span>
                    </label>
                ))}
            </RadioGroup>
        </div>
    );
}
