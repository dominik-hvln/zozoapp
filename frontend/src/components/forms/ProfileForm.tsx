'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface ProfileData {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
}
const profileSchema = z.object({
    firstName: z.string().min(2, 'Imię jest wymagane.'),
    lastName: z.string().min(2, 'Nazwisko jest wymagane.'),
    phone: z.string().min(9, 'Numer telefonu jest nieprawidłowy.'),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const updateProfile = async (data: ProfileFormValues) => (await api.patch('/profile/me', data)).data;

export function ProfileForm({ profileData }: { profileData: ProfileData | undefined }) {
    const queryClient = useQueryClient();
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (profileData) {
            form.reset({
                firstName: profileData.first_name || '',
                lastName: profileData.last_name || '',
                phone: profileData.phone || '',
            });
        }
    }, [profileData, form]);

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profil został zaktualizowany!');
        },
        onError: () => toast.error('Wystąpił błąd podczas aktualizacji profilu.'),
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Imię</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Nazwisko</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={mutation.isPending} className="w-full">
                    {mutation.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </Button>
            </form>
        </Form>
    );
}