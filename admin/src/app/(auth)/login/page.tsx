import { LoginForm } from '@/components/shared/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <LoginForm />
        </div>
    );
}