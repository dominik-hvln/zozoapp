import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MessageSquare } from "lucide-react";
import LocationHandler from "./LocationHandler";

interface ScanData {
    scanId: string;
    childName: string;
    parentName: string;
    parentPhone: string | null;
    message: string | null;
}

async function getScanData(uniqueCode: string): Promise<ScanData> {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/scans/${uniqueCode}`;
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
                        <LocationHandler scanId={data.scanId} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle className="text-2xl text-red-600">Błąd</CardTitle></CardHeader>
                    <CardContent><p>Nie znaleziono aktywnego tatuażu dla podanego kodu lub kod jest nieprawidłowy.</p></CardContent>
                </Card>
            </div>
        );
    }
}