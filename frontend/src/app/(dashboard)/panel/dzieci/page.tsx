'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import AppleIcon from '@/assets/avatars/apple.svg';
import LemonIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';
import Image from 'next/image';

interface Child {
    id: string;
    name: string;
    avatar_url: string | null;
    _count: {
        assignments: number;
    };
}
const getChildren = async (): Promise<Child[]> => (await api.get('/children')).data;
const addChild = async (name: string): Promise<Child> => (await api.post('/children', { name })).data;
const updateChild = async ({ id, name }: { id: string, name: string }) => (await api.put(`/children/${id}`, { name })).data;
const deleteChild = async (id: string) => (await api.delete(`/children/${id}`)).data;

// --- SCHEMAT WALIDACJI ---
const formSchema = z.object({
    name: z.string().min(2, { message: 'Imię musi mieć co najmniej 2 litery.' }),
});


// --- KOMPONENT ---
export default function DzieciPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const queryClient = useQueryClient();

    const { data: children, isLoading, error } = useQuery({ queryKey: ['children'], queryFn: getChildren });

    const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });

    // Mutacja do tworzenia i aktualizacji dziecka
    const childMutation = useMutation({
        mutationFn: (values: { name: string }) => {
            if (editingChild) {
                return updateChild({ id: editingChild.id, name: values.name });
            }
            return addChild(values.name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
            toast.success(editingChild ? 'Profil dziecka zaktualizowany!' : 'Profil dziecka dodany!');
            setDialogOpen(false);
            setEditingChild(null);
        },
        onError: () => toast.error('Wystąpił błąd.'),
    });

    // Mutacja do usuwania dziecka
    const deleteMutation = useMutation({
        mutationFn: deleteChild,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['children'] });
            toast.success('Profil dziecka usunięty.');
        },
        onError: () => toast.error('Wystąpił błąd podczas usuwania.'),
    });

    function openEditDialog(child: Child) {
        setEditingChild(child);
        form.reset({ name: child.name });
        setDialogOpen(true);
    }

    function openNewDialog() {
        setEditingChild(null);
        form.reset({ name: '' });
        setDialogOpen(true);
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        childMutation.mutate(values);
    }

    const fruitAvatars = [AppleIcon, LemonIcon, StrawberryIcon];
    const getFallbackAvatar = (id: string) => (id.charCodeAt(0) % fruitAvatars.length);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Twoje Dzieci</h1>
                    <p className="text-muted-foreground">Zarządzaj profilami swoich dzieci.</p>
                </div>
                <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Dziecko</Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>{editingChild ? 'Edytuj profil dziecka' : 'Dodaj nowy profil'}</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Imię dziecka</FormLabel>
                                    <FormControl><Input placeholder="np. Ania" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" disabled={childMutation.isPending} className="w-full">
                                {childMutation.isPending ? "Zapisywanie..." : "Zapisz"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {isLoading ? (<p>Ładowanie...</p>)
                : error ? (<p className="text-red-500">Wystąpił błąd.</p>)
                    : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {children && children.map((child) => {
                                const FallbackIcon = fruitAvatars[getFallbackAvatar(child.id)];
                                return (
                                    <div key={child.id} className="border rounded-lg shadow-sm text-center p-4 bg-white relative">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditDialog(child)}><Pencil className="mr-2 h-4 w-4" /> Edytuj</DropdownMenuItem>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Usuń</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Czy na pewno chcesz usunąć profil?</AlertDialogTitle></AlertDialogHeader>
                                                        <AlertDialogDescription>Tej operacji nie można cofnąć. Spowoduje to trwałe usunięcie profilu {child.name}.</AlertDialogDescription>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteMutation.mutate(child.id)} className="bg-red-600 hover:bg-red-700">Usuń</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <Avatar className="w-24 h-24 mx-auto mb-4">
                                            <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
                                            <AvatarFallback className="bg-gray-100 flex items-center justify-center p-2">
                                                <Image src={FallbackIcon.src} alt="Owocowy awatar" width={64} height={64} />
                                            </AvatarFallback>

                                        </Avatar>
                                        <h3 className="font-semibold">{child.name}</h3>
                                        {child._count.assignments > 0 ? (
                                            <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                                                Aktywne tatuaże: {child._count.assignments}
                                            </Badge>
                                        ) : (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Brak aktywnych tatuaży
                                            </p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
        </div>
    );
}