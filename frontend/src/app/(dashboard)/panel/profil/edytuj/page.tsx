'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getProfile = async () => (await api.get('/profile/me')).data;

export default function ProfilEditPage() {
    const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Edytuj swój profil</CardTitle>
                    <CardDescription>Zaktualizuj swoje dane osobowe.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfileForm profileData={profile} />
                    <div className='mt-4 flex justify-center'>
                        <Link href="/panel/profil">
                            <Button variant="ghost">
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Anuluj i wróć
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}