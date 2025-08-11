'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

// Import komponentów
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Sticker } from 'lucide-react';
import { AktywneTatuaze } from '@/components/shared/AktywneTatuaze';

// --- TYPY I FUNKCJE API (bez zmian) ---
interface Child { id: string; name: string; }
const getChildren = async (): Promise<Child[]> => (await api.get('/children')).data;
interface ActivationPayload { uniqueCode: string; childId: string; }
const activateTattoo = async (payload: ActivationPayload) => (await api.post('/tattoos/activate', payload)).data;

export default function TatuazePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

    useEffect(() => {
        const kodFromUrl = searchParams.get('kod');
        if (kodFromUrl) {
            setScannedCode(kodFromUrl);
            // Wyczyść parametr z URL, aby uniknąć ponownego ustawienia stanu
            router.replace('/panel/tatuaze', {scroll: false});
        }
    }, [searchParams, router]);

    const { data: children, isLoading: isLoadingChildren } = useQuery({ queryKey: ['children'], queryFn: getChildren });

    const mutation = useMutation({
        mutationFn: activateTattoo,
        onSuccess: () => {
            toast.success('Sukces!', { description: 'Tatuaż został pomyślnie aktywowany.' });
            queryClient.invalidateQueries({ queryKey: ['activeTattoos'] }); // Odśwież listę aktywnych tatuaży
            setScannedCode(null);
            setSelectedChildId(null);
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.message || "Wystąpił nieznany błąd.";
            toast.error('Błąd aktywacji', { description: errorMessage });
        }
    });

    const handleActivate = () => {
        if (!scannedCode || !selectedChildId) {
            toast.warning('Brak danych', { description: 'Musisz zeskanować kod i wybrać dziecko.' });
            return;
        }
        mutation.mutate({ uniqueCode: scannedCode, childId: selectedChildId });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Aktywne Tatuaże</h1>
                <p className="text-muted-foreground">
                    Aktywuj nowy tatuaż lub zarządzaj już aktywnymi.
                </p>
            </div>

            <div className="p-6 border rounded-lg bg-white shadow-sm">
                {/* Ta sekcja pozostaje bez zmian */}
                {scannedCode ? (
                    <>
                        <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Kod Zeskanowany!</AlertTitle>
                            <AlertDescription className="font-mono text-green-700">{scannedCode}</AlertDescription>
                        </Alert>
                        <h3 className="font-semibold mb-2">Krok 2: Wybierz dziecko i aktywuj</h3>
                        <div className="flex items-center gap-4">
                            <Select onValueChange={setSelectedChildId} value={selectedChildId || undefined}>
                                <SelectTrigger><SelectValue placeholder="Wybierz dziecko z listy..." /></SelectTrigger>
                                <SelectContent>
                                    {children?.map(child => (
                                        <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleActivate} disabled={!selectedChildId || mutation.isPending}>
                                {mutation.isPending ? "Aktywowanie..." : "Aktywuj Tatuaż"}
                            </Button>
                        </div>
                        <Button variant="link" onClick={() => setScannedCode(null)} className="mt-2 text-sm pl-0">Anuluj</Button>
                    </>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Aktywuj nowy tatuaż</h3>
                            <p className="text-sm text-muted-foreground">Kliknij, aby uruchomić skaner i przypisać kod do dziecka.</p>
                        </div>
                        <Link href="/panel/tatuaze/skanuj">
                            <Button>
                                <Sticker className="mr-2 h-4 w-4" />
                                Rozpocznij Skanowanie
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Dodajemy nową sekcję z listą */}
            <AktywneTatuaze />
        </div>
    );
}