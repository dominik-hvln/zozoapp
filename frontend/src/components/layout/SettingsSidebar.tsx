'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsLinks = [
    { href: "/panel/ustawienia", label: "Powiadomienia i preferencje" },
    { href: "/panel/ustawienia/bezpieczenstwo", label: "Bezpieczeństwo" },
    { href: "/panel/ustawienia/informacje", label: "Informacje o aplikacji" },
];

export function SettingsSidebar() {
    const pathname = usePathname();
    return (
        <aside className="w-full md:w-1/4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-4">Ustawienia</h2>
                <nav className="flex flex-col space-y-1">
                    {settingsLinks.map(link => (
                        <Link key={link.href} href={link.href} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === link.href ? 'bg-muted text-primary' : 'hover:bg-muted'}`}>
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}