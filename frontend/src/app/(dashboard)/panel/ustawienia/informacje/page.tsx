'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, FileText, Shield, Info } from "lucide-react";
import Link from "next/link";

export default function AppInfoPage() {
    const infoLinks = [
        { 
            href: "/panel/ustawienia/informacje/regulamin", 
            label: "Regulamin Sklepu Internetowego", 
            icon: FileText 
        },
        { 
            href: "/panel/ustawienia/informacje/polityka-prywatnosci", 
            label: "Polityka Prywatności", 
            icon: Shield 
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Informacje o aplikacji</CardTitle>
                <CardDescription>Dokumenty prawne i informacje o wersji aplikacji.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    {infoLinks.map((link) => (
                        <Link 
                            key={link.href} 
                            href={link.href}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <link.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{link.label}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
                    <p>Wersja aplikacji: 1.0.0</p>
                    <p>© {new Date().getFullYear()} Appity Mikołaj Lubawy. Wszelkie prawa zastrzeżone.</p>
                </div>
            </CardContent>
        </Card>
    );
}
