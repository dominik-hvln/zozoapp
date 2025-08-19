'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import Image from 'next/image';

// Import komponentów
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, MoreHorizontal, Pencil, Trash2, CalendarIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Import awatarów
import AppleIcon from '@/assets/avatars/apple.svg';
import BananaIcon from '@/assets/avatars/lemon.svg';
import StrawberryIcon from '@/assets/avatars/strawberry.svg';

// --- TYPY I FUNKCJE API ---
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


// --- KOMPONENT ---
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

    const { data: children, isLoading, error } = useQuery({ queryKey: ['children'], queryFn: getChildren });

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Twoje Dzieci</h1>
                <Button onClick={openNewDialog}><PlusCircle className="mr-2 h-4 w-4" />Dodaj Dziecko</Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader><DialogTitle>{editingChild ? 'Edytuj profil dziecka' : 'Dodaj nowy profil'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Imię</Label>
                            <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Data urodzenia</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !formData.date_of_birth && "text-muted-foreground")}>
                                        {formData.date_of_birth ? format(formData.date_of_birth, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                                    <Calendar
                                        locale={pl}
                                        mode="single"
                                        selected={formData.date_of_birth}
                                        onSelect={(date) => setFormData({...formData, date_of_birth: date})}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                        captionLayout="dropdown"
                                        fromYear={new Date().getFullYear() - 20}
                                        toYear={new Date().getFullYear()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="important_info">Ważne informacje</Label>
                            <Textarea id="important_info" value={formData.important_info} onChange={(e) => setFormData({...formData, important_info: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="illnesses">Choroby</Label>
                            <Textarea id="illnesses" value={formData.illnesses} onChange={(e) => setFormData({...formData, illnesses: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="allergies">Uczulenia</Label>
                            <Textarea id="allergies" value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} />
                        </div>
                        <Button type="submit" disabled={childMutation.isPending} className="w-full">
                            {childMutation.isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? <p>Ładowanie...</p> : children?.map((child) => {
                    const FallbackIcon = getFallbackAvatar(child.id);
                    return (
                        <div key={child.id} className="border rounded-lg shadow-sm text-center p-4 bg-white relative">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {/* POPRAWKA JEST TUTAJ: */}
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => openEditDialog(child)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edytuj
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            {/* I TUTAJ: */}
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" /> Usuń
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Czy na pewno chcesz usunąć profil?</AlertDialogTitle></AlertDialogHeader>
                                            <AlertDialogDescription>Tej operacji nie można cofnąć.</AlertDialogDescription>
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
                                <AvatarFallback className="bg-gray-100 p-2"><Image src={FallbackIcon} alt="Owoc" /></AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold">{child.name}</h3>
                            <p className={`text-xs ${child._count.assignments > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {child._count.assignments > 0 ? `Aktywne tatuaże: ${child._count.assignments}` : 'Brak aktywnych tatuaży'}
                            </p>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}