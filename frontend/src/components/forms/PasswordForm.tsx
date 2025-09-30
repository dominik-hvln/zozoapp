'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const passwordSchema = z.object({
    oldPass: z.string().min(1, 'Stare hasło jest wymagane.'),
    newPass: z.string().min(8, 'Nowe hasło musi mieć co najmniej 8 znaków.'),
    confirmNewPassword: z.string(),
}).refine(data => data.newPass === data.confirmNewPassword, {
    message: "Nowe hasła nie są takie same",
    path: ["confirmNewPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const changePassword = async (data: Omit<PasswordFormValues, 'confirmNewPassword'>) =>
    (await api.post('/profile/me/change-password', data)).data;

export function PasswordForm() {
    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { oldPass: '', newPass: '', confirmNewPassword: '' }
    });

    const mutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            form.reset();
            toast.success('Hasło zostało pomyślnie zmienione!');
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message: string })?.message || "Wystąpił nieznany błąd.";
            toast.error('Błąd zmiany hasła', { description: errorMessage });
        },
    });

    const onSubmit = (data: PasswordFormValues) => {
        const { confirmNewPassword, ...submissionData } = data;
        mutation.mutate(submissionData);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="oldPass" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Stare hasło</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="newPass" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nowe hasło</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Powtórz nowe hasło</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={mutation.isPending} className="bg-orange-400 hover:bg-orange-500">
                    {mutation.isPending ? 'Zmienianie...' : 'Zmień hasło'}
                </Button>
            </form>
        </Form>
    );
}