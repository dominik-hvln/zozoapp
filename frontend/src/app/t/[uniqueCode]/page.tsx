'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MessageSquare, MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ScanData {
    scanId: string;
    childName: string;
    parentName: string;
    parentPhone: string | null;
    message: string | null;
}

// Ten komponent będzie teraz po stronie klienta, aby używać hooków
export default function ScanPage({ params }: { params: { uniqueCode: string } }) {
    const [data, setData] = useState<ScanData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

    useEffect(() => {
        // Pobierz dane o skanie
        api.get(`/scans/${params.uniqueCode}`)
            .then(response => {
                setData(response.data);
                // Po udanym pobraniu danych, poproś o lokalizację
                askForLocation(response.data.scanId);
            })
            .catch(() => setError('Nie znaleziono aktywnego tatuażu dla tego kodu.'));

        const askForLocation = (scanId: string) => {
            setLocationStatus('pending');
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setLocationStatus('success');
                        // Wyślij lokalizację na serwer
                        api.post(`/scans/${scanId}/location`, { latitude, longitude });
                    },
                    () => {
                        setLocationStatus('error');
                    }
                );
            } else {
                setLocationStatus('error');
            }
        };
    }, [params.uniqueCode]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle className="text-2xl text-red-600">Błąd</CardTitle></CardHeader>
                    <CardContent><p>{error}</p></CardContent>
                </Card>
            </div>
        );
    }

    if (!data) {
        return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">Dziękujemy za pomoc!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        Znalazłeś/aś tatuaż należący do{' '}
                        <span className="font-bold">{data.childName}</span>.
                    </p>
                    <p className="text-muted-foreground">Prosimy o pilny kontakt z opiekunem. Rodzic został już powiadomiony.</p>
                    <div className="border-t pt-4 space-y-3">
                        <div className="flex items-center justify-center gap-3"><User className="h-5 w-5 text-muted-foreground" /><span className="font-semibold">{data.parentName}</span></div>
                        {data.parentPhone && <div className="flex items-center justify-center gap-3"><Phone className="h-5 w-5 text-muted-foreground" /><a href={`tel:${data.parentPhone}`} className="font-semibold text-blue-600 hover:underline">{data.parentPhone}</a></div>}
                        {data.message && <div className="flex items-start text-left gap-3 pt-2 bg-gray-50 p-3 rounded-md"><MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" /><p className="text-sm italic">&quot;{data.message}&quot;</p></div>}
                    </div>
                    <div className="border-t pt-4 mt-4">
                        {locationStatus === 'pending' && <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Oczekiwanie na zgodę na lokalizację...</p>}
                        {locationStatus === 'success' && <p className="text-sm text-green-600 font-semibold flex items-center justify-center gap-2"><MapPin className="h-4 w-4"/> Lokalizacja została wysłana do rodzica. Dziękujemy!</p>}
                        {locationStatus === 'error' && <p className="text-sm text-red-500">Nie udało się pobrać lokalizacji.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}