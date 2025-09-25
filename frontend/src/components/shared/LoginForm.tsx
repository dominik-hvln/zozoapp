'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Capacitor } from '@capacitor/core';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    saveCredentials,
    autofillWithBiometrics,
    checkBiometrics,
    humanizeBiometricError,
    getBiometricErrorCode,
    shouldPromptToSave,      // NEW
    markPromptDeclined,      // NEW
} from '@/lib/biometric-credentials';

const loginSchema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    password: z.string().min(1, 'Hasło jest wymagane'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
        useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

    const router = useRouter();
    const setToken = useAuthStore((s) => s.setToken);

    const platform = Capacitor.getPlatform();
    const isNativeMobile = platform === 'ios' || platform === 'android';
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        (async () => {
            if (!isNativeMobile) return;
            const { available } = await checkBiometrics(true);
            setBiometricAvailable(available);
        })();
    }, [isNativeMobile]);

    // === IDENTYCZNY REQUEST JAK WCZEŚNIEJ ===
    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await api.post('/auth/login', data);
            const { access_token } = response.data;
            setToken(access_token);

            // Krok 2: zapytaj o zapis danych (tylko mobilnie, nie zmienia requestu)
            if (isNativeMobile && biometricAvailable) {
                // pytamy tylko gdy ma to sens
                if (await shouldPromptToSave(data.email)) {
                    const wantsSave = window.confirm('Zapisać dane i włączać autouzupełnianie po biometrii?');
                    if (wantsSave) {
                        await saveCredentials(data.email, data.password);
                        toast.success('Dane zapisane w sejfie urządzenia.');
                    } else {
                        await markPromptDeclined();
                    }
                }
            }

            toast.success('Logowanie pomyślne!');
            router.push('/panel');
        } catch {
            toast.error('Błąd logowania:', { description: 'Nieprawidłowy email lub hasło.' });
        }
    };

    const onBiometricAutofill = async () => {
        try {
            const creds = await autofillWithBiometrics();
            if (!creds) {
                toast.error('Brak zapisanych danych do autouzupełnienia.');
                return;
            }
            setValue('email', creds.email, { shouldValidate: true });
            setValue('password', creds.password, { shouldValidate: true });
            toast.success('Uzupełniono zapisane dane.');
        } catch (err: unknown) {
            const code = getBiometricErrorCode(err);
            toast.error(humanizeBiometricError(code));
        }
    };

    return (
        <Card className="w-full max-w-lg px-16 z-999">
            <CardHeader>
                <CardTitle className="text-center text-[26px]">Zaloguj się!</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="on">
                    <div className="space-y-2 mb-8">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            className="h-[50px]"
                            autoComplete="username"   // web autofill
                            inputMode="email"
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            {...register('email')}
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2 mb-1">
                        <Label htmlFor="password">Hasło</Label>
                        <Input
                            id="password"
                            type="password"
                            className="h-[50px]"
                            autoComplete="current-password" // web autofill
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            {...register('password')}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <Link href="/forgot-password" passHref>
                            <Button variant="link" className="px-0 pt-0 text-sm h-auto">Nie pamiętasz hasła?</Button>
                        </Link>

                        {biometricAvailable && (
                            <Button type="button" variant="secondary" onClick={onBiometricAutofill} className="text-sm h-9">
                                Autouzupełnij biometrią
                            </Button>
                        )}
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full h-[50px]">
                        {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
                    </Button>
                </form>

                <div className="text-center">
                    <p className="mt-4 text-sm">Nie masz jeszcze konta?</p>
                    <Link href="/register" className="font-semibold text-blue-600 hover:underline">Zarejestruj się</Link>
                </div>
            </CardContent>
        </Card>
    );
}
