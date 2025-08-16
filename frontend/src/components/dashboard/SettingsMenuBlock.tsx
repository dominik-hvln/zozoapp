import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
export const SettingsMenuBlock = () => (
    <Card><CardHeader><CardTitle>Ustawienia</CardTitle></CardHeader><CardContent><Link href="/panel/ustawienia" className="text-primary hover:underline">Przejdź do ustawień konta</Link></CardContent></Card>
);