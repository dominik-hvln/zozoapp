'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PartyPopper } from 'lucide-react';

const getOrderBySessionId = async (sessionId: string) => (await api.get(`/store/orders/by-session/${sessionId}`)).data;
const getPublicOrderBySessionId = async (sessionId: string, token: string) => (
    await api.get(`/store/orders/public/by-session/${sessionId}`, { params: { token } })
).data;

export function OrderSummaryPageContent({ isPublic = false }: { isPublic?: boolean }) {
    const params = useParams();
    const searchParams = useSearchParams();
    const sessionId = params.sessionId as string;
    const publicToken = searchParams.get('token') || '';

    const { data: order, isLoading, isSuccess, error } = useQuery({
        queryKey: ['order-summary', sessionId, isPublic, publicToken],
        queryFn: () => (isPublic ? getPublicOrderBySessionId(sessionId, publicToken) : getOrderBySessionId(sessionId)),
        enabled: !!sessionId && (!isPublic || !!publicToken),
        retry: 5,
        retryDelay: 1000,
    });

    useEffect(() => {
        if (isSuccess) {
            toast.success('Dziękujemy za Twoje zamówienie!');
        }
    }, [isSuccess]);

    if (isPublic && !publicToken) return <div className="p-10 text-red-500">Brak tokenu dostępu do zamówienia.</div>;
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

export default function OrderSummaryPage() {
    return <OrderSummaryPageContent />;
}