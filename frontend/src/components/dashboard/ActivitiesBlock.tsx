'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, MapPin } from 'lucide-react';
import { Scan } from '@/types';

interface ActivitiesBlockProps {
    activities?: Scan[];
    onActivityClick: (scan: Scan) => void;
}

export function ActivitiesBlock({ activities = [], onActivityClick }: ActivitiesBlockProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><History className="h-5 w-5 mr-2 text-muted-foreground" /><span>Ostatnia Aktywność</span></CardTitle>
                <CardDescription>Kliknij na wpis, aby zobaczyć szczegóły.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {activities.map((scan) => (
                        <li
                            key={scan.id}
                            className="flex items-start text-sm p-2 -mx-2 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => onActivityClick(scan)}
                        >
                            <div className="flex-1">
                                <p className="font-semibold">{scan.assignments?.children?.name || 'Brak danych'}</p>
                                <p className="text-xs text-muted-foreground font-mono">{scan.assignments?.tattoo_instances?.unique_code || 'Brak danych'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {scan.latitude && <MapPin className="h-4 w-4 text-blue-500" />}
                                <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(scan.scan_time).toLocaleTimeString('pl-PL')}</p>
                            </div>
                        </li>
                    ))}
                    {activities.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Brak zdarzeń.</p>}
                </ul>
            </CardContent>
        </Card>
    );
}