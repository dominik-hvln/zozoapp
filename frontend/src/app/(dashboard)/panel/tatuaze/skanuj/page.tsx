'use client';

import { Scanner } from '@yudiel/react-qr-scanner';
import Link from 'next/link';
import { ChevronLeft, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IDetectedBarcode } from '@yudiel/react-qr-scanner';

export default function SkanujPage() {

    const handleScanSuccess = (result: IDetectedBarcode[]) => {
        // Odczytujemy tekst z pierwszego znalezionego kodu QR
        const scannedText = result[0].rawValue;

        // Używamy "twardego" przekierowania, które jest najstabilniejsze
        window.location.href = `/panel/tatuaze?kod=${scannedText}`;
    };

    const handleScanError = (error: Error) => {
        // Sprawdzamy, czy to nie jest błąd "No QR code found", który jest normalny
        if (error?.message.includes('No QR code found')) return;
        console.error('Błąd skanera QR:', error?.message);
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
                        Skanowanie rozpocznie się automatycznie.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="aspect-square w-full overflow-hidden rounded-lg border">
                        <Scanner
                            onScan={handleScanSuccess}
                            onError={handleScanError}
                            constraints={{
                                facingMode: 'environment',
                            }}
                            components={{
                                // Wyłączamy niepotrzebne elementy interfejsu skanera
                                onOff: false,
                                torch: false,
                            }}
                        />
                    </div>
                    <div className='mt-4 flex justify-center'>
                        <Link href="/panel/tatuaze">
                            <Button variant="ghost">
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Anuluj i wróć
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}