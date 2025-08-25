'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';
import { Scanner as WebScanner } from '@yudiel/react-qr-scanner';
import { IDetectedBarcode } from '@yudiel/react-qr-scanner';

// Import komponentów
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ScanLine, Camera as CameraIcon } from 'lucide-react';

export default function SkanujPage() {
    const router = useRouter();
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

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

    const handleWebScanSuccess = (result: IDetectedBarcode[]) => {
        handleCodeDetected(result[0].rawValue);
    };

    const handleWebScanError = (error: unknown) => {
        if (error instanceof Error && !error.message.includes('No QR code found')) {
            console.error('Błąd skanera webowego:', error.message);
        }
    };

    const handleNativeScan = async () => {
        try {
            await Camera.requestPermissions();
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera,
            });

            if (image.webPath) {
                const response = await fetch(image.webPath);
                const blob = await response.blob();
                const reader = new FileReader();

                reader.onload = (e) => {
                    const img = new window.Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, img.width, img.height);
                            const imageData = ctx.getImageData(0, 0, img.width, img.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height);
                            handleCodeDetected(code?.data || null);
                        }
                    };
                    img.src = e.target?.result as string;
                };
                reader.readAsDataURL(blob);
            }
            // POPRAWKA: Używamy typu `unknown` i sprawdzamy, czy błąd ma treść
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('User cancelled photos app')) {
                return;
            }
            console.error('Błąd kamery natywnej:', error);
            toast.error('Nie udało się otworzyć aparatu lub odczytać zdjęcia.');
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
                        {isNative ? 'Naciśnij przycisk, aby uruchomić aparat.' : 'Skanowanie rozpocznie się automatycznie.'}
                    </p>
                </CardHeader>
                <CardContent>
                    {isNative ? (
                        <div className="aspect-square w-full flex items-center justify-center">
                            <Button onClick={handleNativeScan} className="h-24 w-24 rounded-full flex-col">
                                <CameraIcon className="h-10 w-10 mb-2"/>
                                <span>Skanuj</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="aspect-square w-full overflow-hidden rounded-lg border">
                            <WebScanner
                                onScan={handleWebScanSuccess}
                                onError={handleWebScanError}
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
        </div>
    );
}