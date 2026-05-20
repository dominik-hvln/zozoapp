import { RegisterForm } from '@/components/shared/RegisterForm';
import { isAppStoreReviewModeServer } from '@/lib/app-review-server';
import Link from 'next/link';

export default function RegisterPage() {
    const reviewMode = isAppStoreReviewModeServer();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-safe">
            <RegisterForm reviewMode={reviewMode} />
            <p className="mt-4 text-sm">
                Masz już konto?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Zaloguj się
                </Link>
            </p>
        </div>
    );
}