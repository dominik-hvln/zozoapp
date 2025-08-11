import { LoginForm } from '@/components/shared/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <LoginForm />
            <p className="mt-4 text-sm">
                Nie masz konta?{' '}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                    Zarejestruj się
                </Link>
            </p>
        </div>
    );
}