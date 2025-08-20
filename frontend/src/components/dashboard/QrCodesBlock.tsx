'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, QrCode } from 'lucide-react';
import { Badge } from '../ui/badge';

interface Assignment {
    id: string;
    is_active: boolean;
    children: { name: string } | null;
    tattoo_instances: { unique_code: string } | null;
}

interface QrCodesBlockProps {
    assignments?: Assignment[];
}

export function QrCodesBlock({ assignments = [] }: QrCodesBlockProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Twoje Ostatnie Kody QR ({assignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {assignments.map((assignment) => (
                        <Link href={`/panel/tatuaze`} key={assignment.id} className="text-center border rounded-lg p-3 hover:bg-gray-50">
                            <QrCode className="w-12 h-12 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-xs font-mono">{assignment.tattoo_instances?.unique_code || 'B/D'}</p>
                            <p className="text-xs text-muted-foreground">Przypisany do: {assignment.children?.name || 'B/D'}</p>
                            <Badge variant={assignment.is_active ? 'default' : 'secondary'} className="mt-1">
                                {assignment.is_active ? 'Aktywny' : 'Nieaktywny'}
                            </Badge>
                        </Link>
                    ))}
                    <Link href="/panel/tatuaze" className="flex flex-col items-center justify-center text-center p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 min-h-[150px]">
                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                            <PlusCircle className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-blue-600">Zarządzaj</p>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}