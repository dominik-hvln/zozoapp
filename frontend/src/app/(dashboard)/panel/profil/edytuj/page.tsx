'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, ArrowLeft } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useParams } from 'next/navigation';

const getProfile = async () => (await api.get('/profile/me')).data;
const uploadAvatar = async (data: FormData) => (await api.post('/uploads/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
})).data;

export default function ProfilEditPage() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: getProfile });
    const { setToken } = useAuthStore();

    const avatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: async () => {
            toast.success('Awatar został pomyślnie zmieniony!');
            try {
                const response = await api.post('/auth/refresh');
                setToken(response.data.access_token);
                await queryClient.invalidateQueries({ queryKey: ['profile'] });
                await queryClient.invalidateQueries({ queryKey: ['fullProfile'] });
            } catch (error) {
                toast.error('Nie udało się odświeżyć sesji. Zaloguj się ponownie, aby zobaczyć zmiany.');
            }
        },
        onError: () => toast.error('Nie udało się wgrać awatara. Sprawdź rozmiar i format pliku.')
    });

    const handleAvatarClick = () => { fileInputRef.current?.click(); };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            avatarMutation.mutate(formData);
        }
    };

    if (isLoading) return <div className="p-4 lg:p-8">Ładowanie...</div>;

    return (
        <div className="space-y-6">
            <Link href="/panel/profil"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Wróć do profilu</Button></Link>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Edytuj swój profil</CardTitle>
                    <CardDescription>Zaktualizuj swoje dane osobowe i awatar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                                <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" key={profile?.avatar_url} />
                                <AvatarFallback className="text-3xl">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div onClick={handleAvatarClick} className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                                <Upload className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                    </div>
                    <ProfileForm profileData={profile} />
                </CardContent>
            </Card>
        </div>
    );
}