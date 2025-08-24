'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Import komponentów
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, PlusCircle, QrCode } from 'lucide-react';
import AppleIcon from '@/assets/avatars/apple.svg';

// --- TYPY I API ---
interface ChildDetails {
    id: string; name: string; avatar_url: string | null; date_of_birth: string | null;
    important_info: string | null; illnesses: string | null; allergies: string | null;
    assignments: { tattoo_instances: { unique_code: string }; }[];
}
const getChildDetails = async (childId: string): Promise<ChildDetails> => (await api.get(`/children/${childId}`)).data;

const calculateAge = (dob: string | null) => {
    if (!dob) return '';
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    return `${age} lat`;
};

// --- KOMPONENT ---
export default function DzieckoDetailsPage() {
    const params = useParams();
    const childId = params.childId as string;

    const { data: child, isLoading } = useQuery({
        queryKey: ['childDetails', childId],
        queryFn: () => getChildDetails(childId),
        enabled: !!childId,
    });

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie profilu...</div>;
    if (!child) return <div className="p-4 lg:p-8">Nie znaleziono profilu dziecka.</div>;

    const FallbackIcon = AppleIcon;

    return (
        <div className="space-y-6">
            <Link href="/panel/dzieci">
                <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Wróć do listy</Button>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center">
                            <Avatar className="w-24 h-24 mb-4">
                                <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                                <AvatarFallback className="p-2 bg-gray-100"><Image src={FallbackIcon} alt="Owoc" /></AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl">{child.name}</CardTitle>
                            {child.date_of_birth && <span className="text-muted-foreground">{calculateAge(child.date_of_birth)}</span>}
                        </CardHeader>
                        <CardContent>
                            {/* OSTATECZNA POPRAWKA: Poprawny link do strony edycji */}
                            <Button asChild className="w-full">
                                <Link href={`/panel/dzieci/edytuj/${childId}`}>
                                    <Edit className="mr-2 h-4 w-4"/> Edytuj profil
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Aktywne kody QR</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {child.assignments.map(assignment => (
                                <div key={assignment.tattoo_instances.unique_code} className="border rounded-lg p-3 text-center">
                                    <QrCode className="w-10 h-10 mx-auto text-muted-foreground" />
                                    <p className="mt-2 text-xs font-mono">{assignment.tattoo_instances.unique_code}</p>
                                </div>
                            ))}
                            <Link href="/panel/tatuaze/skanuj" className="flex flex-col items-center justify-center text-center p-3 border-2 border-dashed rounded-lg hover:bg-gray-50">
                                <PlusCircle className="h-8 w-8 text-blue-500" />
                                <p className="mt-2 text-sm font-medium text-blue-600">Dodaj kod</p>
                            </Link>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Ważne informacje</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <p><strong>Data urodzenia:</strong> {child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString('pl-PL') : 'Nie podano'}</p>
                            <p><strong>Choroby:</strong> {child.illnesses || 'Nie podano'}</p>
                            <p><strong>Alergie:</strong> {child.allergies || 'Nie podano'}</p>
                            <p><strong>Dodatkowe informacje:</strong> {child.important_info || 'Nie podano'}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}