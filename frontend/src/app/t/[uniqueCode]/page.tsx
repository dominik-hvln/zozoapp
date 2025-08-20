import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, HeartPulse, ShieldAlert } from "lucide-react";
import LocationHandler from "./LocationHandler";
import Image from "next/image";
import AppleIcon from '@/assets/avatars/apple.svg';

interface ScanData {
    scanId: string;
    child: {
        name: string;
        age: number | null;
        avatar_url: string | null;
        important_info: string | null;
        illnesses: string | null;
        allergies: string | null;
    };
    parent: {
        fullName: string;
        phone: string | null;
    };
}

async function getScanData(uniqueCode: string): Promise<ScanData> {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/scans/${uniqueCode}`;
    const res = await fetch(apiUrl, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Nie udało się pobrać danych.');
    }
    return res.json();
}

export default async function ScanPage({ params }: { params: Promise<{ uniqueCode: string }> }) {
    const { uniqueCode } = await params;

    try {
        const data = await getScanData(uniqueCode);
        const FallbackIcon = AppleIcon;

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
                <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden">
                    <CardContent className="text-center p-6 space-y-4">
                        <h1 className="text-xl font-semibold text-gray-800">
                            To dziecko może potrzebować pomocy!
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Zeskanowałeś tatuaż bezpieczeństwa Zozo.
                        </p>
                        <Avatar className="w-20 h-20 mx-auto border-2 border-white shadow-sm">
                            <AvatarImage src={data.child.avatar_url || undefined} alt={data.child.name} />
                            <AvatarFallback className="p-1 bg-gray-100">
                                <Image src={FallbackIcon} alt="Owoc" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-center gap-4">
                                <div>
                                    <span>Imię: </span>
                                    <span className="font-bold">{data.child.name}</span>
                                </div>
                                <div>
                                    <span>Wiek: </span>
                                    <span className="font-bold">{data.child.age !== null ? `${data.child.age} lat` : 'B/D'}</span>
                                </div>
                            </div>
                            {data.child.important_info && (
                                <div>
                                    <span>Ważne informacje: </span>
                                    <span className="font-bold">{data.child.important_info}</span>
                                </div>
                            )}
                        </div>
                        {(data.child.illnesses || data.child.allergies) && (
                            <div className="space-y-2 text-center mt-2">
                                {data.child.illnesses && (
                                    <p className="text-sm flex items-center justify-center text-center gap-2">
                                        <HeartPulse className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0"/>
                                        <strong>Choroby:</strong> {data.child.illnesses}
                                    </p>
                                )}
                                {data.child.allergies && (
                                    <p className="text-sm flex items-center justify-center gap-2">
                                        <ShieldAlert className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0"/>
                                        <strong>Alergie:</strong> {data.child.allergies}
                                    </p>
                                )}
                            </div>
                        )}
                        <p className="text-sm font-bold pt-2">
                            Tatuaż został zeskanowany o: {new Date().toLocaleTimeString('pl-PL')}
                        </p>
                        <div className="border-1 rounded-md p-3 mt-3 bg-[#F5F7FC]">
                            <p className="font-bold">{data.parent.fullName}</p>
                            <p className="text-sm text-muted-foreground">Nr. telefonu: {data.parent.phone || 'Nie podano'}</p>
                        </div>
                        {data.parent.phone && (
                            <Button asChild className="w-full bg-[#466EC6] hover:bg-blue-700 text-lg font-bold py-6 rounded-lg">
                                <a href={`tel:${data.parent.phone}`}><Phone className="mr-2 h-5 w-5"/> Zadzwoń do rodzica</a>
                            </Button>
                        )}
                    </CardContent>
                    <CardFooter className="mx-auto">
                        <LocationHandler scanId={data.scanId} />
                    </CardFooter>
                </Card>
            </div>
        );
    } catch (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center shadow-lg rounded-xl">
                    <CardContent className="p-6">
                        <h1 className="text-xl font-semibold text-red-600">Błąd</h1>
                        <p>Nie znaleziono aktywnego tatuażu dla podanego kodu lub kod jest nieprawidłowy.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
}