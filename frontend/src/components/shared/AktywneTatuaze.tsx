'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sticker } from 'lucide-react';

interface TattooInstance { unique_code: string; }
interface Child { name: string; }
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface TattooInstance {
    unique_code: string;
    expires_at: string | null;
}
interface Child { name: string; }
interface Assignment {
    id: string;
    created_at: string;
    is_active: boolean;
    children: Child;
    tattoo_instances: TattooInstance;
}

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
                    Twoje Tatuaże
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
                                    <p className="text-xs text-muted-foreground">
                                        Przypisano do: <span className="font-semibold">{assignment.children.name}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Aktywowano: {format(new Date(assignment.created_at), 'd MMMM yyyy', { locale: pl })}
                                    </p>
                                    {assignment.tattoo_instances.expires_at && (
                                        <p className="text-xs text-muted-foreground">
                                            Wygasa: {format(new Date(assignment.tattoo_instances.expires_at), 'd MMMM yyyy', { locale: pl })}
                                        </p>
                                    )}
                                </div>
                                <Badge variant={assignment.is_active ? 'secondary' : 'destructive'}>
                                    {assignment.is_active ? 'Aktywny' : 'Wygasł'}
                                </Badge>
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