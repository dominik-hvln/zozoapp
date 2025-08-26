'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle} from 'lucide-react';
import AppleIcon from '@/assets/avatars/apple.svg';
import BananaIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';
import Link from 'next/link';

interface Child {
    id: string;
    name: string;
    avatar_url: string | null;
    date_of_birth: string | null;
    important_info: string | null;
    illnesses: string | null;
    allergies: string | null;
    _count: { assignments: number };
}
const getChildren = async (): Promise<Child[]> => (await api.get('/children')).data;
const addChild = async (data: Partial<Child>) => (await api.post('/children', data)).data;
const updateChild = async ({ id, data }: { id: string, data: Partial<Child> }) => (await api.put(`/children/${id}`, data)).data;
const deleteChild = async (id: string) => (await api.delete(`/children/${id}`)).data;

export default function DzieciPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        date_of_birth: undefined as Date | undefined,
        important_info: '',
        illnesses: '',
        allergies: '',
    });

    const queryClient = useQueryClient();

    const { data: children, isLoading } = useQuery({ queryKey: ['children'], queryFn: getChildren });

    const childMutation = useMutation({
        mutationFn: (values: typeof formData) => {
            const dataToSubmit = {
                ...values,
                name: values.name,
                date_of_birth: values.date_of_birth ? values.date_of_birth.toISOString() : null,
            };
            if (editingChild) {
                return updateChild({ id: editingChild.id, data: dataToSubmit });
            }
            return addChild(dataToSubmit);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
            toast.success(editingChild ? 'Profil dziecka zaktualizowany!' : 'Profil dziecka dodany!');
            setDialogOpen(false);
        },
        onError: () => toast.error('Wystąpił błąd.'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteChild,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
            toast.success('Profil dziecka usunięty.');
        },
    });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.length < 2) {
            toast.error("Imię musi mieć co najmniej 2 znaki.");
            return;
        }
        childMutation.mutate(formData);
    };

    function openEditDialog(child: Child) {
        setEditingChild(child);
        setFormData({
            name: child.name,
            date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : undefined,
            important_info: child.important_info || '',
            illnesses: child.illnesses || '',
            allergies: child.allergies || '',
        });
        setDialogOpen(true);
    }

    function openNewDialog() {
        setEditingChild(null);
        setFormData({ name: '', date_of_birth: undefined, important_info: '', illnesses: '', allergies: '' });
        setDialogOpen(true);
    }

    const fruitAvatars = [AppleIcon, BananaIcon, StrawberryIcon];
    const getFallbackAvatar = (id: string) => fruitAvatars[id.charCodeAt(0) % fruitAvatars.length];

    return (
        <Card className="space-y-6">
            <CardHeader className="flex items-center justify-between mb-0">
                <h1 className="text-3xl font-bold">Twoje Dzieci</h1>
                <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Dziecko</Button>
            </CardHeader>

            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? <p>Ładowanie...</p> : children?.map((child) => {
                    const FallbackIcon = getFallbackAvatar(child.id);
                    return (
                        <Link href={`/panel/dzieci/${child.id}`} key={child.id} className="text-center border rounded-lg p-3 hover:bg-gray-50">
                            <Avatar className="w-20 h-20 mx-auto">
                                <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                                <AvatarFallback className="bg-gray-100 p-2">
                                    <Image src={FallbackIcon} alt="Owocowy awatar" />
                                </AvatarFallback>
                            </Avatar>
                            <p className="mt-2 text-sm font-medium">{child.name}</p>
                            <p className={`text-xs ${child._count.assignments > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {child._count.assignments > 0 ? 'Aktywny tatuaż' : 'Brak tatuażu'}
                            </p>
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
    );
}