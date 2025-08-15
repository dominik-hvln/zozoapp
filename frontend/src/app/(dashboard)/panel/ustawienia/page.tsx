'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

// Import komponentów
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// --- Schematy Walidacji ---
const profileSchema = z.object({
    firstName: z.string().min(2, 'Imię jest wymagane.'),
    lastName: z.string().min(2, 'Nazwisko jest wymagane.'),
    phone: z.string().min(9, 'Numer telefonu jest nieprawidłowy.'),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    oldPass: z.string().min(1, 'Stare hasło jest wymagane.'),
    newPass: z.string().min(8, 'Nowe hasło musi mieć co najmniej 8 znaków.'),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

// --- Funkcje API ---
const getProfile = async () => (await api.get('/profile/me')).data;
const updateProfile = async (data: ProfileFormValues) => (await api.patch('/profile/me', data)).data;
const changePassword = async (data: PasswordFormValues) => (await api.post('/profile/me/change-password', data)).data;

// --- Komponenty Formularzy ---
function ProfileForm({ profileData }: { profileData: any }) {
    const queryClient = useQueryClient();
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: profileData?.first_name || '',
            lastName: profileData?.last_name || '',
            phone: profileData?.phone || '',
        },
    });

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profil został zaktualizowany!');
        },
        onError: () => toast.error('Wystąpił błąd.'),
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Imię</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Nazwisko</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}</Button>
            </form>
        </Form>
    );
}

function PasswordForm() {
    const form = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema), defaultValues: { oldPass: '', newPass: '' } });

    const mutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            form.reset();
            toast.success('Hasło zostało zmienione!');
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message: string })?.message || "Wystąpił nieznany błąd.";
            toast.error('Błąd zmiany hasła', { description: errorMessage });
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="oldPass" render={({ field }) => (<FormItem><FormLabel>Stare hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="newPass" render={({ field }) => (<FormItem><FormLabel>Nowe hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Zmienianie...' : 'Zmień hasło'}</Button>
            </form>
        </Form>
    );
}

// --- Główny Komponent Strony ---
export default function UstawieniaPage() {
    const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });

    if (isLoading) return <div className="p-10">Ładowanie...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Ustawienia Konta</h1>
                <p className="text-muted-foreground">Zarządzaj swoimi danymi i bezpieczeństwem.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Dane osobowe</CardTitle><CardDescription>Zmień swoje imię, nazwisko i numer telefonu.</CardDescription></CardHeader>
                    <CardContent><ProfileForm profileData={profile} /></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Zmiana hasła</CardTitle><CardDescription>Zaktualizuj swoje hasło do konta.</CardDescription></CardHeader>
                    <CardContent><PasswordForm /></CardContent>
                </Card>
            </div>
        </div>
    );
}