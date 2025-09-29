'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import Image from 'next/image';

// Import komponentów
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CalendarIcon, ArrowLeft, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AppleIcon from '@/assets/avatars/apple.svg';

// --- TYPY I FUNKCJE API ---
interface Child {
    id: string; name: string; avatar_url: string | null; date_of_birth: string | null;
    important_info: string | null; illnesses: string | null; allergies: string | null;
}
const getChildDetails = async (childId: string): Promise<Child> => (await api.get(`/children/${childId}`)).data;
const updateChild = async ({ id, data }: { id: string, data: Partial<Child> }) => (await api.put(`/children/${id}`, data)).data;
const deleteChild = async (childId: string) => (await api.delete(`/children/${childId}`)).data;
const uploadAvatar = async (data: FormData) => (await api.post('/uploads/avatar', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
})).data;

// --- KOMPONENT ---
export default function DzieckoEditFormPage() {
    const params = useParams();
    const router = useRouter();
    const childId = params.childId as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: '', date_of_birth: undefined as Date | undefined,
        important_info: '', illnesses: '', allergies: '',
    });

    const queryClient = useQueryClient();

    const { data: child, isLoading } = useQuery({
        queryKey: ['childDetails', childId],
        queryFn: () => getChildDetails(childId),
        enabled: !!childId,
    });

    useEffect(() => {
        if (child) {
            setFormData({
                name: child.name,
                date_of_birth: child.date_of_birth ? new Date(child.date_of_birth) : undefined,
                important_info: child.important_info || '',
                illnesses: child.illnesses || '',
                allergies: child.allergies || '',
            });
        }
    }, [child]);

    const updateMutation = useMutation({
        mutationFn: (values: typeof formData) => {
            const dataToSubmit = { ...values, date_of_birth: values.date_of_birth ? values.date_of_birth.toISOString() : null };
            return updateChild({ id: childId, data: dataToSubmit });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['childDetails', childId] });
            queryClient.invalidateQueries({ queryKey: ['children'] });
            toast.success('Profil dziecka został pomyślnie zaktualizowany!');
            router.push(`/panel/dzieci/${childId}`);
        },
        onError: () => toast.error('Wystąpił błąd podczas aktualizacji.'),
    });

    const avatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: () => {
            toast.success('Awatar został pomyślnie zmieniony!');
            queryClient.invalidateQueries({ queryKey: ['childDetails', childId] });
        },
        onError: () => toast.error('Nie udało się wgrać awatara. Sprawdź rozmiar i format pliku.')
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteChild(childId),
        onSuccess: () => {
            toast.success('Dziecko zostało pomyślnie usunięte.');
            queryClient.invalidateQueries({ queryKey: ['children'] });
            router.push('/panel/dzieci');
        },
        onError: () => toast.error('Wystąpił błąd podczas usuwania dziecka.'),
    });

    const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); updateMutation.mutate(formData); };
    const handleAvatarClick = () => { fileInputRef.current?.click(); };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('childId', childId);
            avatarMutation.mutate(formData);
        }
    };

    if (isLoading || !child) return <div className="p-4 lg:p-8">Ładowanie formularza...</div>;
    const FallbackIcon = AppleIcon;

    return (
        <Card>
            <CardContent>
                <div className="space-y-6">
                    <Link href={`/panel/dzieci/${childId}`}><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Anuluj i wróć do podglądu</Button></Link>
                    <Card className="max-w-2xl mx-auto mt-4">
                        <CardHeader>
                            <CardTitle>Edytuj profil dziecka</CardTitle>
                            <CardDescription>Zaktualizuj poniższe informacje.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-center mb-6">
                                <div className="relative group">
                                    <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                                        <AvatarImage src={child.avatar_url || undefined} alt={child.name} key={child.avatar_url} />
                                        <AvatarFallback className="p-2 bg-gray-100"><Image src={FallbackIcon} alt="Owoc" /></AvatarFallback>
                                    </Avatar>
                                    <div
                                        onClick={handleAvatarClick}
                                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                    >
                                        <Upload className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                            </div>
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
                                            <Calendar locale={pl} mode="single" selected={formData.date_of_birth} onSelect={(date) => setFormData({...formData, date_of_birth: date})} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus captionLayout="dropdown" fromYear={new Date().getFullYear() - 20} toYear={new Date().getFullYear()} />
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
                                <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                                    {updateMutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                                </Button>
                            </form>
                            <div className="mt-6 border-t pt-6">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full">Usuń dziecko</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Czy na pewno chcesz usunąć to dziecko?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Ta akcja jest nieodwracalna. Spowoduje to trwałe usunięcie profilu dziecka i wszystkich powiązanych z nim danych, w tym aktywnych tatuaży.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                                                {deleteMutation.isPending ? "Usuwanie..." : "Tak, usuń"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}