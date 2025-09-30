'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const createCustomerPortal = async () => (await api.post('/store/customer-portal')).data;
const createSubscriptionCheckout = async () => (await api.post('/store/checkout/subscription')).data;
const getProfile = async () => (await api.get('/profile/me')).data;

export default function SubscriptionPage() {
    const { user } = useAuthStore();
    const { data: profile } = useQuery({ queryKey: ['fullProfile'], queryFn: getProfile });

    const portalMutation = useMutation({
        mutationFn: createCustomerPortal,
        onSuccess: (data) => { window.location.href = data.url; },
        onError: () => toast.error('Nie udało się otworzyć portalu. Spróbuj ponownie.'),
    });

    const checkoutMutation = useMutation({
        mutationFn: createSubscriptionCheckout,
        onSuccess: (data) => { window.location.href = data.url; },
        onError: () => toast.error('Nie udało się rozpocząć płatności.'),
    });

    const handleManageSubscription = () => {
        if (user?.status !== 'TRIAL') {
            portalMutation.mutate();
        } else {
            checkoutMutation.mutate();
        }
    };

    const isLoading = portalMutation.isPending || checkoutMutation.isPending;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Twoja Subskrypcja</CardTitle>
                <CardDescription>Zarządzaj swoim planem, metodami płatności i przeglądaj historię faktur.</CardDescription>
            </CardHeader>
            <CardContent>
                <Card className="border-dashed">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">Aktualny Plan</p>
                                <p className="text-sm text-muted-foreground">
                                    {user?.status === 'TRIAL' ? 'Darmowy okres próbny' : 'ZozoApp Plan Miesięczny'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">Status</p>
                                <p className={`text-sm font-medium ${user?.status === 'ACTIVE' || user?.status === 'TRIAL' ? 'text-green-600' : 'text-red-600'}`}>
                                    {user?.status === 'TRIAL' ? 'Okres próbny' : 'Aktywny'}
                                </p>
                            </div>
                        </div>
                        {profile?.trial_expires_at && user?.status === 'TRIAL' && (
                            <p className="text-sm text-muted-foreground mt-4">
                                Twój okres próbny kończy się: {format(new Date(profile.trial_expires_at), 'PPP', { locale: pl })}
                            </p>
                        )}
                        <Button onClick={handleManageSubscription} disabled={isLoading} className="w-full mt-4 bg-orange-400 hover:bg-orange-500">
                            {isLoading
                                ? 'Ładowanie...'
                                : user?.status === 'TRIAL'
                                    ? 'Wykup Pełną Subskrypcję'
                                    : 'Zarządzaj Subskrypcją w Stripe'
                            }
                        </Button>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}