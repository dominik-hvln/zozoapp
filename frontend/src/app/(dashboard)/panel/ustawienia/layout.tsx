import { SettingsSidebar } from "@/components/layout/SettingsSidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Ustawienia Konta</h1>
                <p className="text-muted-foreground">Zarządzaj swoimi danymi i preferencjami.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <SettingsSidebar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}