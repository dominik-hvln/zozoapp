'use client';

import { api } from "@/lib/api";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function LocationHandler({ scanId }: { scanId: string }) {
    const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationStatus('success');
                api.post(`/scans/${scanId}/location`, {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                setLocationStatus('error');
            }
        );
    }, [scanId]);

    return (
        <div className="w-full text-center">
            {locationStatus === 'pending' && <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Oczekiwanie na zgodę na lokalizację...</p>}
            {locationStatus === 'success' && <p className="text-sm text-green-600 font-semibold flex items-center justify-center gap-2"><MapPin className="h-4 w-4"/> Lokalizacja została wysłana do rodzica. Dziękujemy!</p>}
            {locationStatus === 'error' && <p className="text-sm text-red-500">Nie udało się pobrać lokalizacji. Rodzic został powiadomiony o skanie bez Twojej lokalizacji.</p>}
        </div>
    );
}