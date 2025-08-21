'use client';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AxiosError } from 'axios';

const schema = z.object({
    newPass: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków.'),
    confirmNewPassword: z.string(),
}).refine(data => data.newPass === data.confirmNewPassword, { message: "Hasła nie są takie same", path: ["confirmNewPassword"] });

export default function ResetPasswordPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { newPass: '', confirmNewPassword: '' } });

    const mutation = useMutation({
        mutationFn: (values: { newPass: string }) => api.post('/auth/reset-password', { token, newPass: values.newPass }),
        onSuccess: (data) => {
            toast.success('Sukces!', { description: data.data.message });
            router.push('/login');
        },
        onError: (error: AxiosError) => {
            const errorMessage = (error.response?.data as { message: string })?.message || 'Wystąpił błąd.';
            toast.error('Błąd', { description: errorMessage });
        },
    });

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader><CardTitle>Ustaw nowe hasło</CardTitle><CardDescription>Wprowadź swoje nowe, bezpieczne hasło.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                            <FormField control={form.control} name="newPass" render={({ field }) => (
                                <FormItem><FormLabel>Nowe hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="confirmNewPassword" render={({ field }) => (
                                <FormItem><FormLabel>Powtórz nowe hasło</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="submit" disabled={mutation.isPending} className="w-full">
                                {mutation.isPending ? 'Ustawianie...' : 'Ustaw nowe hasło'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}