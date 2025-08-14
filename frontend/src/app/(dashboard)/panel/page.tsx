'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Sticker, History, ArrowRight, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface Child { id: string; name: string; avatar_url: string | null; }
interface Scan {
    id: string;
    scan_time: string;
    latitude: number | null;
    longitude: number | null;
    assignments: {
        children: { name: string };
        tattoo_instances: { unique_code: string };
    };
}
interface DashboardData { recentChildren: Child[]; activeTattoosCount: number; recentScans: Scan[]; }
const getDashboardSummary = async (): Promise<DashboardData> => (await api.get('/dashboard/summary')).data;

// --- KOMPONENT ---
export default function PanelPage() {
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

    const { data, isLoading } = useQuery({ queryKey: ['dashboardSummary'], queryFn: getDashboardSummary });

    const fruitAvatars = [AppleIcon, LemonIcon, StrawberryIcon];
    const getFallbackAvatar = (id: string) => fruitAvatars[id.charCodeAt(0) % fruitAvatars.length];

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie danych...</div>;

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Panel Główny</h1>
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Lewa kolumna */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Twoje Dzieci</span>
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                </CardTitle>
                                <CardDescription>Szybki podgląd profili.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex space-x-2">
                                    {data?.recentChildren.map((child) => {
                                        const FallbackIcon = getFallbackAvatar(child.id);
                                        return (
                                            <Avatar key={child.id} title={child.name}>
                                                <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                                                <AvatarFallback className="bg-gray-100 p-1">
                                                    <img src={FallbackIcon.src} alt="Owocowy awatar" />
                                                </AvatarFallback>
                                            </Avatar>
                                        );
                                    })}
                                </div>
                                <Button asChild size="sm" className="mt-4 w-full">
                                    <Link href="/panel/dzieci">Zarządzaj Dziećmi <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Aktywne Tatuaże</span>
                                    <Sticker className="h-5 w-5 text-muted-foreground" />
                                </CardTitle>
                                <CardDescription>Liczba tatuaży w użyciu.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-center">
                                    {data?.activeTattoosCount}
                                </div>
                                <Button asChild size="sm" className="mt-4 w-full">
                                    <Link href="/panel/tatuaze">Zarządzaj Tatuażami <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Prawa kolumna (sidebar) na aktywność */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><History className="h-5 w-5 mr-2 text-muted-foreground" /><span>Ostatnia Aktywność</span></CardTitle>
                                <CardDescription>Kliknij na wpis, aby zobaczyć szczegóły.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {data?.recentScans.map((scan) => (
                                        <li
                                            key={scan.id}
                                            className="flex items-start text-sm p-2 -mx-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                            onClick={() => setSelectedScan(scan)}
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold">{scan.assignments?.children?.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{scan.assignments?.tattoo_instances?.unique_code}</p>
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

            {/* Okno Dialogowe z Mapą */}
            <Dialog open={!!selectedScan} onOpenChange={(isOpen) => !isOpen && setSelectedScan(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Szczegóły Skanu</DialogTitle>
                    </DialogHeader>
                    {selectedScan && (
                        <div className="space-y-4">
                            <p><strong>Dziecko:</strong> {selectedScan.assignments.children.name}</p>
                            <p><strong>Kod:</strong> <span className="font-mono">{selectedScan.assignments.tattoo_instances.unique_code}</span></p>
                            <p><strong>Czas:</strong> {new Date(selectedScan.scan_time).toLocaleString('pl-PL')}</p>

                            {selectedScan.latitude && selectedScan.longitude ? (
                                <div className="h-64 w-full rounded-md overflow-hidden mt-4">
                                    <MapContainer
                                        center={[selectedScan.latitude, selectedScan.longitude]}
                                        zoom={15}
                                        scrollWheelZoom={false}
                                        style={{ height: "100%", width: "100%" }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Marker position={[selectedScan.latitude, selectedScan.longitude]} />
                                    </MapContainer>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Brak danych o lokalizacji dla tego skanu.</p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}