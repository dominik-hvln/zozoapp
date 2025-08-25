'use client';

import { useEffect } from 'react';
import { Browser } from '@capacitor/browser';

export default function PaymentCompletePage() {
    useEffect(() => {
        Browser.close();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Przetwarzanie płatności, proszę czekać...</p>
        </div>
    );
}