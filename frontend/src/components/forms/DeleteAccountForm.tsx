'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation'; // <-- Dodaj tę linię

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const deleteAccountSchema = z.object({
    password: z.string().min(1, 'Hasło jest wymagane do potwierdzenia.'),
});

type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

// Funkcja API do usuwania konta
const deleteAccount = async (data: DeleteAccountFormValues) =>
    (await api.delete('/profile/me/delete-account', { data })).data;

// Komponent
export function DeleteAccountForm() {
    const router = useRouter();
    const form = useForm<DeleteAccountFormValues>({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: { password: '' }
    });

    const mutation = useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            toast.success('Konto zostało pomyślnie usunięte!');
            // Przekierowanie na stronę główną lub logowania po usunięciu
            router.push('/');
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message: string })?.message || "Wystąpił nieznany błąd.";
            toast.error('Błąd usuwania konta', { description: errorMessage });
        },
    });

    const onSubmit = (data: DeleteAccountFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Wpisz swoje hasło, aby potwierdzić usunięcie konta</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={mutation.isPending} variant="destructive">
                    {mutation.isPending ? 'Usuwanie...' : 'Usuń konto'}
                </Button>
            </form>
        </Form>
    );
}