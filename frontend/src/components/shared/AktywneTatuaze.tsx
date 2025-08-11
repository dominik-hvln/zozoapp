'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sticker } from 'lucide-react';

// Definicja typów
interface TattooInstance { unique_code: string; }
interface Child { name: string; }
interface Assignment {
    id: string;
    created_at: string;
    children: Child;
    tattoo_instances: TattooInstance;
}

// Funkcja do pobierania danych
const getActiveTattoos = async (): Promise<Assignment[]> => {
    const response = await api.get('/tattoos');
    return response.data;
};

export function AktywneTatuaze() {
    const { data: tattoos, isLoading } = useQuery({
        queryKey: ['activeTattoos'],
        queryFn: getActiveTattoos,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sticker className="h-5 w-5" />
                    Twoje Aktywne Tatuaże
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Ładowanie...</p>
                ) : tattoos && tattoos.length > 0 ? (
                    <ul className="space-y-3">
                        {tattoos.map((assignment) => (
                            <li key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-mono text-sm text-gray-800">{assignment.tattoo_instances.unique_code}</p>
                                    <p className="text-xs text-muted-foreground">Przypisano do: <span className="font-semibold">{assignment.children.name}</span></p>
                                </div>
                                <Badge variant="secondary">Aktywny</Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nie masz jeszcze żadnych aktywnych tatuaży.</p>
                )}
            </CardContent>
        </Card>
    );
}