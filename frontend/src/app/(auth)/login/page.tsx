import { LoginForm } from '@/components/shared/LoginForm';
import Image from 'next/image';
import {Card} from '@/components/ui/card';

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <Card className="w-full max-w-lg bg-[#466ec6] items-center py-5 mb-5 z-999">
                <Image src="/logo.png" alt="ZozoApp Logo" width={150} height={52} priority />
            </Card>
            <LoginForm />
            <Image className="absolute left-0 top-0" src="/pomarancza.svg" alt="ZozoApp Logo" width={560} height={538} priority />
            <Image className="absolute right-0 bottom-0" src="/borowka.svg" alt="ZozoApp Logo" width={735} height={791} priority />
        </div>
    );
}