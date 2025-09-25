'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search } from 'lucide-react';

export interface InPostParcelLocker {
    name: string;
    address: {
        line1: string;
        line2: string;
    };
    location: {
        latitude: number;
        longitude: number;
    };
    status: string;
    type: string[];
    payment_available: boolean;
    functions: string[];
    partner_id: number;
    payment_point_descr: string;
    location_description: string;
    opening_hours: string;
    address_details: {
        post_code: string;
        city: string;
        province: string;
        street: string;
        building_number: string;
    };
}

interface Props {
    selectedLocker: InPostParcelLocker | null;
    onSelect: (locker: InPostParcelLocker) => void;
    onClear: () => void;
}

export function InPostSelector({ selectedLocker, onSelect, onClear }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lockers, setLockers] = useState<InPostParcelLocker[]>([]);
    const [loading, setLoading] = useState(false);

    const searchLockers = async (query: string) => {
        if (!query || query.length < 3) return;

        setLoading(true);
        try {
            // Używamy proxy API do InPost, ponieważ nie mają CORS
            const response = await fetch(`https://api-shipx-pl.easypack24.net/v1/points?relative_point=${encodeURIComponent(query)}&type=parcel_locker&per_page=20`);
            const data = await response.json();
            setLockers(data.items || []);
        } catch (error) {
            console.error('Błąd podczas wyszukiwania paczkomatów:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchLockers(searchTerm);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSelect = (locker: InPostParcelLocker) => {
        onSelect(locker);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2">
            <Label>Paczkomat InPost</Label>

            {selectedLocker ? (
                <div className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">{selectedLocker.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClear}>
                            Zmień
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {selectedLocker.address.line1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {selectedLocker.address_details.post_code} {selectedLocker.address_details.city}
                    </p>
                </div>
            ) : (
                <Button
                    variant="outline"
                    onClick={() => setIsOpen(true)}
                    className="w-full justify-start"
                >
                    <Search className="h-4 w-4 mr-2" />
                    Wybierz paczkomat
                </Button>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Wybierz paczkomat InPost</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div>
                            <Input
                                placeholder="Wpisz miasto, kod pocztowy lub adres..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {loading && (
                            <div className="text-center py-4">
                                <Search className="animate-spin mx-auto mb-2" />
                                <p>Wyszukiwanie paczkomatów...</p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {lockers.map((locker) => (
                                <div
                                    key={locker.name}
                                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSelect(locker)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">{locker.name}</h4>
                                            <p className="text-xs text-muted-foreground">{locker.address.line1}</p>
                                            {locker.address.line2 && (
                                                <p className="text-xs text-muted-foreground">{locker.address.line2}</p>
                                            )}
                                            <div className="flex gap-1 mt-1">
                                                {locker.functions.includes('parcel_collect') && (
                                                    <Badge variant="secondary" className="text-xs">Odbiór</Badge>
                                                )}
                                                {locker.payment_available && (
                                                    <Badge variant="secondary" className="text-xs">Płatność</Badge>
                                                )}
                                            </div>
                                        </div>
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                    </div>
                                </div>
                            ))}
                            {!loading && searchTerm.length >= 3 && lockers.length === 0 && (
                                <p className="text-center text-muted-foreground py-8">
                                    Nie znaleziono paczkomatów dla podanego zapytania.
                                </p>
                            )}
                            {!loading && searchTerm.length < 3 && (
                                <p className="text-center text-muted-foreground py-8">
                                    Wpisz co najmniej 3 znaki, aby wyszukać paczkomaty
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}