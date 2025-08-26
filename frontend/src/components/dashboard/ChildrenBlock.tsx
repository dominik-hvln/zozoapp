'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ArrowRight, PlusCircle } from 'lucide-react';
import Image from 'next/image';
// Import awatarów
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';

interface Child { id: string; name: string; avatar_url: string | null; _count: { assignments: number } }
const getChildren = async (): Promise<Child[]> => (await api.get('/children')).data;

export function ChildrenBlock() {
    const { data: children, isLoading } = useQuery({ queryKey: ['children'], queryFn: getChildren });

    const fruitAvatars = [AppleIcon, LemonIcon, StrawberryIcon];
    const getFallbackAvatar = (id: string) => fruitAvatars[id.charCodeAt(0) % fruitAvatars.length];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dzieci ({children?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Ładowanie...</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {children?.map((child) => {
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
                    <Link href="/panel/dzieci" className="flex flex-col items-center justify-center text-center p-3 border-2 border-dashed rounded-lg hover:bg-gray-50">
                        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                            <PlusCircle className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="mt-2 text-sm font-medium text-blue-600">Dodaj dziecko</p>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}