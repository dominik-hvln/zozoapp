'use client';

import { LoginForm } from '@/components/shared/LoginForm';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Panel Administratora</h1>
            <LoginForm />
        </div>
    );
}