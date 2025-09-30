'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';

const getOrderBySessionId = async (sessionId: string) => (await api.get(`/store/orders/by-session/${sessionId}`)).data;

export default function OrderSummaryPage() {
    const params = useParams();
    const sessionId = params.sessionId as string;

    const { data: order, isLoading, isSuccess, error } = useQuery({
        queryKey: ['order-summary', sessionId],
        queryFn: () => getOrderBySessionId(sessionId),
        enabled: !!sessionId,
        retry: 5,
        retryDelay: 1000,
    });

    useEffect(() => {
        if (isSuccess) {
            toast.success('Dziękujemy za Twoje zamówienie!');
        }
    }, [isSuccess]);

    if (isLoading) return <div className="p-10">Finalizowanie Twojego zamówienia...</div>;
    if (error) return <div className="p-10 text-red-500">Wystąpił błąd podczas pobierania danych zamówienia.</div>;

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
                </CardContent>
            </Card>
        </div>
    );
}