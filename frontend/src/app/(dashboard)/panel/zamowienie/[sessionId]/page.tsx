'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';

// Ta funkcja jest wywoływana tylko raz, aby potwierdzić zamówienie
const confirmOrder = async (sessionId: string) => (await api.post('/orders/success', { sessionId })).data;

export default function OrderSummaryPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    // Używamy useQuery, ale wywołujemy je tylko raz
    const { data: order, isLoading, isSuccess } = useQuery({
        queryKey: ['order-confirmation', sessionId],
        queryFn: () => confirmOrder(sessionId),
        enabled: !!sessionId,
        retry: false, // Nie ponawiaj próby, jeśli się nie uda
    });

    useEffect(() => {
        if (isSuccess) {
            toast.success('Dziękujemy za Twoje zamówienie!');
        }
    }, [isSuccess]);

    if (isLoading) return <div className="p-10">Przetwarzanie Twojego zamówienia...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="text-center items-center">
                    <PartyPopper className="h-12 w-12 text-green-500" />
                    <CardTitle className="text-2xl">Zamówienie Zakończone!</CardTitle>
                    <CardDescription>Otrzymasz e-mail z potwierdzeniem.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p><strong>Numer Twojego zamówienia:</strong> {order?.id}</p>
                    <p><strong>Suma:</strong> {(order?.total_amount / 100).toFixed(2)} zł</p>
                    {/* Tutaj wyświetlimy listę zakupionych produktów */}
                </CardContent>
            </Card>
        </div>
    );
}