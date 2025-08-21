'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { QRCodeSVG } from 'qrcode.react';
import ReactDOMServer from 'react-dom/server';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, QrCode, FileArchive } from 'lucide-react';

interface Assignment {
    id: string;
    users: { email: string } | null;
    children: { name: string } | null;
    tattoo_instances: { unique_code: string } | null;
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

export default function AdminTattoosPage() {
    const queryClient = useQueryClient();
    const [codeCount, setCodeCount] = useState('50');
    const [qrCodeData, setQrCodeData] = useState<{ code: string; content: string } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    const { data: assignments, isLoading: isLoadingAssignments } = useQuery({ queryKey: ['admin-assignments'], queryFn: getAssignments });
    const { data: newTattoos, isLoading: isLoadingNew } = useQuery({ queryKey: ['admin-new-tattoos'], queryFn: getNewTattoos });

    const mutation = useMutation({
        mutationFn: generateCodes,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-new-tattoos'] });
            toast.success(`Pomyślnie wygenerowano ${data.count} nowych kodów!`);
            setCodeCount('50');
        },
        onError: () => toast.error('Wystąpił błąd podczas generowania kodów.'),
    });

    const deactivateMutation = useMutation({
        mutationFn: deactivateAssignment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-assignments'] });
            toast.success('Przypisanie zostało pomyślnie zdezaktywowane.');
        },
        onError: () => toast.error('Wystąpił błąd podczas dezaktywacji.'),
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const count = parseInt(codeCount, 10);
        if (isNaN(count) || count < 1 || count > 500) {
            toast.error('Nieprawidłowa liczba', { description: 'Wprowadź liczbę od 1 do 500.' });
            return;
        }
        mutation.mutate(count);
    };

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

    const handleShowQr = async (tattooId: string) => {
        try {
            const response = await api.get(`/admin/tattoos/${tattooId}/qr-content`);
            setQrCodeData({
                code: response.data.uniqueCode,
                content: response.data.content
            });
        } catch (error) {
            toast.error('Nie udało się pobrać danych do kodu QR.');
        }
    };

    const handleDownloadSvg = () => {
        if (!qrCodeData) return;
        const svgEl = document.getElementById('qrcode-svg');
        if (svgEl) {
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${qrCodeData.code}.svg`;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = (isChecked: boolean | 'indeterminate') => {
        if (isChecked === true) {
            setSelectedIds(newTattoos?.map(t => t.id) || []);
        } else {
            setSelectedIds([]);
        }
    };

    const handleBulkExport = async () => {
        if (selectedIds.length === 0) {
            toast.warning('Zaznacz przynajmniej jeden kod do eksportu.');
            return;
        }
        setIsExporting(true);
        toast.info(`Rozpoczynam eksport ${selectedIds.length} kodów QR...`);

        try {
            const zip = new JSZip();
            const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://app.zozoapp.pl/';
            const selectedTattoos = newTattoos?.filter(t => selectedIds.includes(t.id)) || [];

            for (const tattoo of selectedTattoos) {
                const qrContent = `${frontendUrl}/t/${tattoo.unique_code}`;
                const svgString = ReactDOMServer.renderToStaticMarkup(
                    <QRCodeSVG value={qrContent} size={256} level="M" />
                );
                zip.file(`${tattoo.unique_code}.svg`, svgString);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, 'qrcodes_svg.zip');
            toast.success('Kody QR zostały pomyślnie wyeksportowane.');
            setSelectedIds([]);
        } catch (error) {
            toast.error('Wystąpił błąd podczas eksportu plików SVG.');
        } finally {
            setIsExporting(false);
        }
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
                    <CardDescription>Podaj liczbę unikalnych kodów, które chcesz dodać do systemu.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex items-start gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code-count">Liczba kodów</Label>
                            <Input
                                id="code-count"
                                type="number"
                                placeholder="np. 50"
                                value={codeCount}
                                onChange={(e) => setCodeCount(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={mutation.isPending} className="self-end">
                            {mutation.isPending ? 'Generowanie...' : 'Wygeneruj Kody'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Nowe, nieprzypisane kody ({newTattoos?.length || 0})</CardTitle>
                        <CardDescription>Zaznacz kody, które chcesz wyeksportować.</CardDescription>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                        <Button onClick={handleExport} disabled={!newTattoos || newTattoos.length === 0} variant="outline"><Download className="mr-2 h-4 w-4" />Eksportuj Listę (CSV)</Button>
                        <Button onClick={handleBulkExport} disabled={selectedIds.length === 0 || isExporting}>
                            <FileArchive className="mr-2 h-4 w-4" />
                            {isExporting ? 'Eksportowanie...' : `Eksportuj Zaznaczone (${selectedIds.length})`}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        onCheckedChange={handleSelectAll}
                                        checked={newTattoos && selectedIds.length > 0 && selectedIds.length === newTattoos.length ? true : (selectedIds.length > 0 ? 'indeterminate' : false)}
                                    />
                                </TableHead>
                                <TableHead>Kod Tatuażu</TableHead>
                                <TableHead>Data Wygenerowania</TableHead>
                                <TableHead className="text-right">Akcje</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>{
                            isLoadingNew ? (
                                <TableRow><TableCell colSpan={3} className="text-center">Ładowanie...</TableCell></TableRow>
                            ) : (
                                newTattoos?.map((tattoo) => (
                                    <TableRow key={tattoo.id}>
                                        <TableCell><Checkbox onCheckedChange={() => handleSelect(tattoo.id)} checked={selectedIds.includes(tattoo.id)} /></TableCell>
                                        <TableCell className="font-mono">{tattoo.unique_code}</TableCell>
                                        <TableCell>{new Date(tattoo.created_at).toLocaleString('pl-PL')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleShowQr(tattoo.id)}>
                                                <QrCode className="mr-2 h-4 w-4" />
                                                Pokaż QR
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Aktywne Przypisania Tatuaży ({assignments?.length || 0})</CardTitle></CardHeader>
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
                        <TableBody>{
                            isLoadingAssignments ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Ładowanie...</TableCell></TableRow>
                            ) : (
                                assignments?.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-mono">{a.tattoo_instances?.unique_code || 'B/D'}</TableCell>
                                        <TableCell>{a.children?.name || 'B/D'}</TableCell>
                                        <TableCell>{a.users?.email || 'B/D'}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={!a.tattoo_instances}>Dezaktywuj</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Czy na pewno chcesz to zrobić?</AlertDialogTitle>
                                                    </AlertDialogHeader>
                                                    <AlertDialogDescription>
                                                        Tatuaż o kodzie {a.tattoo_instances?.unique_code} zostanie permanentnie zdezaktywowany i przestanie działać.
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

            <Dialog open={!!qrCodeData} onOpenChange={(isOpen) => !isOpen && setQrCodeData(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Kod QR dla: <span className="font-mono">{qrCodeData?.code}</span></DialogTitle>
                    </DialogHeader>
                    <div className="p-4 bg-white">
                        {qrCodeData && (
                            <QRCodeSVG
                                id="qrcode-svg"
                                value={qrCodeData.content}
                                size={256}
                                level="M"
                                className="mx-auto"
                            />
                        )}
                    </div>
                    <Button onClick={handleDownloadSvg}>
                        <Download className="mr-2 h-4 w-4" />
                        Pobierz plik SVG
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}