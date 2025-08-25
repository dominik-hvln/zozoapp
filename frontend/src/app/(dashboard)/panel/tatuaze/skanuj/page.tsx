'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Importy dla obu skanerów
import { Scanner as WebScanner } from '@yudiel/react-qr-scanner';
import { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

// Import komponentów UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ScanLine, Camera as CameraIcon } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SkanujPage() {
    const router = useRouter();
    const [isNative, setIsNative] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sprawdzamy, czy działamy w aplikacji mobilnej, tylko raz po załadowaniu
    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    // Wspólna funkcja do obsługi wykrytego kodu (z obu skanerów)
    const handleCodeDetected = (code: string | null) => {
        if (!code) {
            toast.error('Nie udało się odczytać kodu QR.');
            return;
        }

        try {
            const url = new URL(code);
            const pathParts = url.pathname.split('/');
            const uniqueCode = pathParts[pathParts.length - 1];

            if (uniqueCode) {
                router.push(`/panel/tatuaze?kod=${uniqueCode}`);
            } else {
                throw new Error("Nieprawidłowy format kodu QR.");
            }
        } catch {
            router.push(`/panel/tatuaze?kod=${code}`);
        }
    };

    // --- Logika dla Skanera Webowego (Przeglądarka) ---
    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        handleCodeDetected(result[0].rawValue);
    };
    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    // --- Logika dla Skanera Natywnego (Aplikacja Mobilna) ---
    const startNativeScan = async () => {
        try {
            document.querySelector('body')?.style.setProperty('background-color', 'transparent');

            const result = await CapacitorBarcodeScanner.scanBarcode({
                hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
            });

            handleCodeDetected(result.ScanResult);

        } catch (e: any) {
            if (e.message.toLowerCase().includes('cancelled')) {
                router.back();
            } else {
                setError(`Wystąpił błąd skanera: ${e.message}`);
            }
        } finally {
            document.querySelector('body')?.style.removeProperty('background-color');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit">
                        <ScanLine className="h-8 w-8 text-blue-600"/>
                    </div>
                    <CardTitle className="mt-4 text-2xl font-bold">Skieruj aparat na kod QR</CardTitle>
                    <p className="text-muted-foreground pt-1">
                        {isNative ? 'Naciśnij przycisk, aby uruchomić natywny skaner.' : 'Skanowanie rozpocznie się automatycznie.'}
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Renderujemy odpowiedni komponent w zależności od platformy */}
                    {isNative ? (
                        <div className="aspect-square w-full flex items-center justify-center">
                            <Button onClick={startNativeScan} className="h-24 w-24 rounded-full flex-col">
                                <CameraIcon className="h-10 w-10 mb-2"/>
                                <span>Skanuj</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="aspect-square w-full overflow-hidden rounded-lg border">
                            <WebScanner
                                onScan={handleWebScanSuccess}
                                onError={handleWebScanError}
                                constraints={{ facingMode: 'environment' }}
                                components={{ onOff: false, torch: false }}
                            />
                        </div>
                    )}
                    <div className='mt-4 flex justify-center'>
                        <Link href="/panel/tatuaze">
                            <Button variant="ghost"><ChevronLeft className="h-4 w-4 mr-2" />Anuluj i wróć</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!error} onOpenChange={() => { setError(null); router.back(); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Wystąpił błąd</AlertDialogTitle>
                        <AlertDialogDescription>{error}</AlertDialogDescription>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}