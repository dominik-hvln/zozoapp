'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChildrenBlock } from '@/components/dashboard/ChildrenBlock';
import { QrCodesBlock } from '@/components/dashboard/QrCodesBlock';
import { ActivitiesBlock } from '@/components/dashboard/ActivitiesBlock';
import { YourProfileBlock } from '@/components/dashboard/YourProfileBlock';
import { QuickAccessBlock } from '@/components/dashboard/QuickAccessBlock';
import { SettingsMenuBlock } from '@/components/dashboard/SettingsMenuBlock';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { Scan, DashboardData } from '@/types';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

interface Child { id: string; name: string; avatar_url: string | null; _count: { assignments: number }; }

const getDashboardSummary = async (): Promise<DashboardData> => (await api.get('/dashboard/summary')).data;

// --- KOMPONENT ---
export default function PanelPage() {
    const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
    const { data, isLoading, error } = useQuery({ queryKey: ['dashboardSummary'], queryFn: getDashboardSummary });

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie danych...</div>;
    if (error) return <div className="p-4 lg:p-8 text-red-500">Nie udało się załadować danych. Spróbuj odświeżyć stronę.</div>;

    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-6">
                        <QuickAccessBlock />
                        <ChildrenBlock />
                        <QrCodesBlock assignments={data?.recentAssignments} />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <YourProfileBlock />
                        <ActivitiesBlock activities={data?.recentScans} onActivityClick={setSelectedScan} />
                        <SettingsMenuBlock />
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