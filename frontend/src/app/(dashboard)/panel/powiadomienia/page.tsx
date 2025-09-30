'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    is_read: boolean;
    created_at: string;
}

const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
};

const markAsRead = async (notificationId: string) => {
    await api.patch(`/notifications/${notificationId}/read`);
};

export default function PowiadomieniaPage() {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getNotifications,
    });

    const mutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
        },
        onError: () => {
            toast.error('Nie udało się oznaczyć powiadomienia jako przeczytane.');
        }
    });

    const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
    const readNotifications = notifications?.filter(n => n.is_read) || [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Powiadomienia</h1>
                <p className="text-muted-foreground">Przeglądaj wszystkie swoje aktualności i alerty.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nowe Powiadomienia ({unreadNotifications.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading && <p>Ładowanie...</p>}
                    {unreadNotifications.length > 0 ? (
                        unreadNotifications.map(notification => (
                            <div key={notification.id} className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg flex-wrap">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <BellRing className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{notification.title}</p>
                                    {notification.message && <p className="text-sm text-muted-foreground">{notification.message}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString('pl-PL')}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => mutation.mutate(notification.id)}>
                                    <CheckCheck className="mr-2 h-4 w-4" /> Oznacz jako przeczytane
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">Brak nowych powiadomień.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Przeczytane</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {readNotifications.length > 0 ? (
                        readNotifications.map(notification => (
                            <div key={notification.id} className={cn("flex items-start gap-4 p-4 rounded-lg", { 'opacity-60': notification.is_read })}>
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <BellRing className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{notification.title}</p>
                                    {notification.message && <p className="text-sm text-muted-foreground">{notification.message}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString('pl-PL')}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">Brak przeczytanych powiadomień.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}