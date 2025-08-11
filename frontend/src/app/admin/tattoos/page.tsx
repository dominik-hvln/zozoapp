'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Assignment {
    id: string;
    users: { email: string };
    children: { name: string };
    tattoo_instances: { unique_code: string };
}
interface NewTattoo {
    id: string;
    unique_code: string;
    created_at: string;
}
const getAssignments = async (): Promise<Assignment[]> => (await api.get('/admin/assignments')).data;
const getNewTattoos = async (): Promise<NewTattoo[]> => (await api.get('/admin/tattoos/new')).data;
const generateCodes = async (count: number) => (await api.post('/admin/tattoos/generate', { count })).data;
const deactivateAssignment = async (id: string) => (await api.post(`/admin/assignments/${id}/deactivate`)).data;

const FormSchema = z.object({
    count: z.coerce.number().int().min(1, 'Musi być co najmniej 1').max(500, 'Maksymalnie 500 na raz'),
});
type FormValues = z.infer<typeof FormSchema>;

export default function AdminTattoosPage() {
    const queryClient = useQueryClient();

    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
        queryKey: ['admin-assignments'],
        queryFn: getAssignments
    });

    const { data: newTattoos, isLoading: isLoadingNew } = useQuery({
        queryKey: ['admin-new-tattoos'],
        queryFn: getNewTattoos
    });

    const deactivateMutation = useMutation({
        mutationFn: deactivateAssignment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
            toast.success('Przypisanie zostało pomyślnie zdezaktywowane.');
        },
        onError: () => toast.error('Wystąpił błąd podczas dezaktywacji.'),
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: { count: 50 }
    });

    const mutation = useMutation({
        mutationFn: generateCodes,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['admin-new-tattoos'] });
            toast.success(`Pomyślnie wygenerowano ${data.count} nowych kodów!`);
            form.reset();
        },
        onError: () => toast.error('Wystąpił błąd podczas generowania kodów.'),
    });

    function onSubmit(values: FormValues) {
        mutation.mutate(values.count);
    }

    const handleExport = () => {
        if (!newTattoos || newTattoos.length === 0) {
            toast.warning('Brak kodów do wyeksportowania.');
            return;
        }

        const dataToExport = newTattoos.map(t => ({ 'Kod Tatuażu': t.unique_code }));
        const csv = Papa.unparse(dataToExport);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'nowe-kody-tatuazy.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <div className="p-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Zarządzanie Tatuażami</h1>
                <p className="text-muted-foreground">Generuj nowe kody i przeglądaj aktywne przypisania.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Wygeneruj nowe kody tatuaży</CardTitle>
                    <CardDescription>Podaj liczbę unikalnych kodów, które chcesz dodać do systemu. Będą one miały format ZAP-XXXX-XXXX.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                            <FormField
                                control={form.control}
                                name="count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Liczba kodów</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="np. 50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={mutation.isPending} className="mt-8">
                                {mutation.isPending ? 'Generowanie...' : 'Wygeneruj Kody'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Nowe, nieprzypisane kody ({newTattoos?.length || 0})</CardTitle>
                        <CardDescription>Te kody są gotowe do wysłania klientom.</CardDescription>
                    </div>
                    <Button onClick={handleExport} disabled={!newTattoos || newTattoos.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Eksportuj do CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Kod Tatuażu</TableHead><TableHead>Data Wygenerowania</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {isLoadingNew && <TableRow><TableCell colSpan={2} className="text-center">Ładowanie...</TableCell></TableRow>}
                            {newTattoos?.map((tattoo) => (
                                <TableRow key={tattoo.id}>
                                    <TableCell className="font-mono">{tattoo.unique_code}</TableCell>
                                    <TableCell>{new Date(tattoo.created_at).toLocaleString('pl-PL')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Aktywne Przypisania Tatuaży ({assignments?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kod Tatuażu</TableHead>
                                <TableHead>Przypisano do Dziecka</TableHead>
                                <TableHead>Konto Rodzica</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        {/* POPRAWKA: Usunięto białe znaki i komentarze stąd */}
                        <TableBody>{
                            isLoadingAssignments ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Ładowanie...</TableCell></TableRow>
                            ) : (
                                assignments?.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-mono">{a.tattoo_instances.unique_code}</TableCell>
                                        <TableCell>{a.children.name}</TableCell>
                                        <TableCell>{a.users.email}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">Dezaktywuj</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Czy na pewno chcesz to zrobić?</AlertDialogTitle>
                                                    </AlertDialogHeader>
                                                    <AlertDialogDescription>
                                                        Tatuaż o kodzie {a.tattoo_instances.unique_code} zostanie permanentnie zdezaktywowany i przestanie działać.
                                                    </AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deactivateMutation.mutate(a.id)} className="bg-red-600 hover:bg-red-700">Tak, dezaktywuj</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}