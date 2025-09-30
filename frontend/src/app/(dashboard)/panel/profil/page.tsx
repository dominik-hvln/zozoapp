'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit } from 'lucide-react';
import Image from 'next/image';
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';

interface ProfileData {
    avatar_url: string;
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    created_at: string;
    children: { id: string; name: string; avatar_url: string | null; _count: { assignments: number } }[];
    _count: { assignments: number };
    scansCount: number;
    subscriptionStatus: string;
}

const getProfile = async (): Promise<ProfileData> => (await api.get('/profile/me')).data;

export default function ProfilPage() {
    const { data: profile, isLoading } = useQuery({ queryKey: ['fullProfile'], queryFn: getProfile });
    const { user, logout } = useAuthStore();

    const fruitAvatars = [AppleIcon, LemonIcon];
    const getFallbackAvatar = (id: string) => fruitAvatars[id.charCodeAt(0) % fruitAvatars.length];

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie profilu...</div>;
    if (!profile) return <div className="p-4 lg:p-8">Nie udało się załadować danych.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
                <Card>
                    <CardHeader className="items-center text-center justify-center">
                        <Avatar className="w-24 h-24 mb-4 mx-auto">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={user?.email} key={profile?.avatar_url} />
                            <AvatarFallback>{profile?.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{profile.first_name} {profile.last_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-sm space-y-1">
                        <p>Nr. telefonu: {profile.phone || 'Brak'}</p>
                        <p>Email: {profile.email}</p>
                        <div className="flex gap-2 justify-center pt-4">
                            <Button asChild className="bg-orange-500 hover:bg-orange-600">
                                <Link href="/panel/profil/edytuj"><Edit className="mr-2 h-4 w-4"/>Edytuj profil</Link>
                            </Button>
                            <Button variant="outline" onClick={logout}>Wyloguj się</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Informacje o koncie</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <p>Data utworzenia konta: {new Date(profile.created_at).toLocaleDateString('pl-PL')}</p>
                        <p>Liczba aktywnych kodów: {profile._count?.assignments || 0}</p>
                        <p>Liczba skanów QR: {profile.scansCount}</p>
                        <p>Subskrypcja: {profile.subscriptionStatus}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Opiekunowie</CardTitle></CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src="" alt="User avatar" />
                                <AvatarFallback>{profile.first_name?.[0]}{profile.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{profile.first_name} {profile.last_name}</p>
                                <p className="text-sm text-muted-foreground">Główny opiekun</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4"><UserPlus className="mr-2 h-4 w-4"/>Dodaj opiekuna</Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Twoje dzieci</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {profile.children?.map((child) => {
                            const FallbackIcon = getFallbackAvatar(child.id);
                            return (
                                <div key={child.id} className="border rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                                            <AvatarFallback className="p-1"><Image src={FallbackIcon} alt="Owoc" /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{child.name}</p>
                                            <p className="text-sm text-muted-foreground">{child._count?.assignments || 0} aktywnych tatuaży</p>
                                        </div>
                                    </div>
                                    <Button asChild className="bg-orange-400 hover:bg-orange-500">
                                        <Link href={`/panel/dzieci/${child.id}`}><Edit className="mr-2 h-4 w-4"/>Edytuj</Link>
                                    </Button>
                                </div>
                            );
                        })}
                        {profile.children && profile.children.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">Nie dodałeś jeszcze żadnego dziecka.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}