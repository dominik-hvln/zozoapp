'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

// Import komponentów UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Sticker, History, ArrowRight, MapPin, QrCode, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Import awatarów
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';

// Dynamiczne importowanie mapy
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// --- JEDNA, CENTRALNA DEFINICJA TYPÓW ---
interface Child { id: string; name: string; avatar_url: string | null; _count: { assignments: number }; }
interface Scan {
    id: string;
    scan_time: string;
    latitude: number | null;
    longitude: number | null;
    assignments: {
        child: { name: string };
        tattoo_instance: { unique_code: string };
    };
}
interface Assignment {
    id: string;
    is_active: boolean;
    children: { name: string } | null;
    tattoo_instances: { unique_code: string } | null;
}
interface DashboardData {
    recentChildren: Child[];
    activeTattoosCount: number;
    recentScans: Scan[];
    recentAssignments: Assignment[];
}
const getDashboardSummary = async (): Promise<DashboardData> => (await api.get('/dashboard/summary')).data;

// --- GŁÓWNY KOMPONENT STRONY ---
export default function PanelPage() {
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
    const { data, isLoading, error } = useQuery({ queryKey: ['dashboardSummary'], queryFn: getDashboardSummary });

    const fruitAvatars = [AppleIcon, LemonIcon, StrawberryIcon];
    const getFallbackAvatar = (id: string) => fruitAvatars[id.charCodeAt(0) % fruitAvatars.length];

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie danych...</div>;
    if (error) return <div className="p-4 lg:p-8 text-red-500">Nie udało się załadować danych. Spróbuj odświeżyć stronę.</div>;

    return (
        <>
            <div className="space-y-6">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Szybki Dostęp</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Button asChild size="sm"><Link href="/panel/tatuaze/skanuj">Aktywuj tatuaż</Link></Button>
                                <Button asChild size="sm" variant="outline"><Link href="/panel/dzieci">Dodaj dziecko</Link></Button>
                                <Button asChild size="sm" variant="outline"><Link href="/panel/sklep">Kup tatuaże</Link></Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Dzieci ({data?.recentChildren.length || 0})</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {data?.recentChildren.map((child) => {
                                        const FallbackIcon = getFallbackAvatar(child.id);
                                        return (
                                            <Link href={`/panel/dzieci/${child.id}`} key={child.id} className="text-center">
                                                <Avatar className="w-20 h-20 mx-auto">
                                                    <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                                                    <AvatarFallback className="bg-gray-100 p-2"><Image src={FallbackIcon} alt="Owoc" /></AvatarFallback>
                                                </Avatar>
                                                <p className="mt-2 text-sm font-medium">{child.name}</p>
                                                <p className={`text-xs ${child._count.assignments > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {child._count.assignments > 0 ? 'Aktywny tatuaż' : 'Brak tatuażu'}
                                                </p>
                                            </Link>
                                        );
                                    })}
                                    <Link href="/panel/dzieci" className="flex flex-col items-center justify-center text-center p-3 border-2 border-dashed rounded-lg hover:bg-gray-50">
                                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                                            <PlusCircle className="h-8 w-8 text-blue-500" />
                                        </div>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* QrCodesBlock */}
                        <Card>
                            <CardHeader><CardTitle>Twoje Ostatnie Kody QR ({data?.recentAssignments.length || 0})</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {data?.recentAssignments.map((assignment) => (
                                        <Link href={`/panel/tatuaze`} key={assignment.id} className="text-center border rounded-lg p-3 hover:bg-gray-50">
                                            <QrCode className="w-12 h-12 mx-auto text-muted-foreground" />
                                            <p className="mt-2 text-xs font-mono">{assignment.tattoo_instances?.unique_code || 'B/D'}</p>
                                            <p className="text-xs text-muted-foreground">dla {assignment.children?.name || 'B/D'}</p>
                                            <Badge variant={assignment.is_active ? 'default' : 'secondary'} className="mt-1">{assignment.is_active ? 'Aktywny' : 'Nieaktywny'}</Badge>
                                        </Link>
                                    ))}
                                    <Link href="/panel/tatuaze" className="flex flex-col items-center justify-center text-center p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 min-h-[150px]">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center"><PlusCircle className="h-6 w-6 text-blue-500" /></div>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        {/* ActivitiesBlock */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><History className="h-5 w-5 mr-2 text-muted-foreground" /><span>Ostatnia Aktywność</span></CardTitle>
                                <CardDescription>Kliknij na wpis, aby zobaczyć szczegóły.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data?.recentScans.map((scan) => (
                                        <li key={scan.id} className="flex items-start text-sm p-2 -mx-2 rounded-md hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedScan(scan)}>
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
                                    {data?.recentScans.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Brak zdarzeń.</p>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Dialog open={!!selectedScan} onOpenChange={(isOpen) => !isOpen && setSelectedScan(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Szczegóły Skanu</DialogTitle></DialogHeader>
                    {selectedScan && (
                        <div className="space-y-4">
                            <p><strong>Dziecko:</strong> {selectedScan.assignments.children.name}</p>
                            <p><strong>Kod:</strong> <span className="font-mono">{selectedScan.assignments.tattoo_instances.unique_code}</span></p>
                            <p><strong>Czas:</strong> {new Date(selectedScan.scan_time).toLocaleString('pl-PL')}</p>
                            {selectedScan.latitude && selectedScan.longitude ? (
                                <div className="h-64 w-full rounded-md overflow-hidden mt-4">
                                    <MapContainer center={[selectedScan.latitude, selectedScan.longitude]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[selectedScan.latitude, selectedScan.longitude]} />
                                    </MapContainer>
                                </div>
                            ) : ( <p className="text-sm text-muted-foreground italic flex items-center gap-2"><MapPin className="h-4 w-4" /> Brak danych o lokalizacji dla tego skanu.</p> )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}