'use client';

import { api } from "@/lib/api";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function LocationHandler({ scanId }: { scanId: string }) {
    const [locationStatus, setLocationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

    useEffect(() => {
        setLocationStatus('pending');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocationStatus('success');
                    // Wyślij lokalizację na serwer
                    api.post(`/scans/${scanId}/location`, { latitude, longitude });
                },
                () => setLocationStatus('error')
            );
        } else {
            setLocationStatus('error');
        }
    }, [scanId]);

    return (
        <div className="border-t pt-4 mt-4">
            {locationStatus === 'pending' && <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Oczekiwanie na zgodę na lokalizację...</p>}
            {locationStatus === 'success' && <p className="text-sm text-green-600 font-semibold flex items-center justify-center gap-2"><MapPin className="h-4 w-4"/> Lokalizacja została wysłana do rodzica. Dziękujemy!</p>}
            {locationStatus === 'error' && <p className="text-sm text-red-500">Nie udało się pobrać lokalizacji.</p>}
        </div>
    );
}