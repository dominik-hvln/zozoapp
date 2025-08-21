'use client';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({ email: z.string().email('Nieprawidłowy adres email.') });

export default function ForgotPasswordPage() {
    const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

    const mutation = useMutation({
        mutationFn: (email: string) => api.post('/auth/forgot-password', { email }),
        onSuccess: (data) => {
            toast.success('Sprawdź swoją skrzynkę e-mail', { description: data.data.message });
        },
        onError: () => toast.error('Wystąpił błąd. Spróbuj ponownie.'),
    });

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle>Zresetuj hasło</CardTitle><CardDescription>Podaj swój adres e-mail, a wyślemy Ci link do zresetowania hasła.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d.email))} className="space-y-4">
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={mutation.isPending} className="w-full">
                                {mutation.isPending ? 'Wysyłanie...' : 'Wyślij link'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}