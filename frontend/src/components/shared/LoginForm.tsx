'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

// Schemat walidacji dla logowania
const loginSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(1, 'Hasło jest wymagane'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });
    const router = useRouter();
    const setToken = useAuthStore((state) => state.setToken);

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await api.post('/auth/login', data);
            const { access_token } = response.data;

            setToken(access_token);

            console.log('Logowanie pomyślne!', access_token);
            alert('Logowanie pomyślne! Zostaniesz przekierowany do panelu.');

            // Przekieruj użytkownika do panelu
            router.push('/panel');

        } catch (error) {
            console.error('Błąd logowania:', error);
            alert('Nieprawidłowy email lub hasło.');
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Witaj ponownie!</CardTitle>
                <CardDescription>Zaloguj się, aby uzyskać dostęp do swojego panelu.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="jan@kowalski.pl" {...register('email')} />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Hasło</Label>
                        <Input id="password" type="password" {...register('password')} />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}