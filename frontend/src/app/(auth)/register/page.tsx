import { RegisterForm } from '@/components/shared/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <RegisterForm />
            <p className="mt-4 text-sm">
                Masz już konto?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Zaloguj się
                </Link>
            </p>
        </div>
    );
}