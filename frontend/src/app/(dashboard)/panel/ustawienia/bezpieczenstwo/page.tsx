'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/forms/PasswordForm";
import { DeleteAccountForm } from "@/components/forms/DeleteAccountForm";

export default function SecurityPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bezpieczeństwo</CardTitle>
                <CardDescription>Zarządzaj bezpieczeństwem swojego konta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Zmiana hasła</h3>
                    <p className="text-sm text-muted-foreground pt-1">Zalecamy używanie długiego i unikalnego hasła, aby chronić swoje konto.</p>
                </div>
                <div className="md:w-1/2">
                    <PasswordForm />
                </div>
                <div className="pt-6">
                    <h3 className="text-lg font-medium text-destructive">Usuwanie konta</h3>
                    <p className="text-sm text-muted-foreground pt-1">Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.</p>
                </div>
                <div className="md:w-1/2">
                    <DeleteAccountForm />
                </div>
            </CardContent>
        </Card>
    );
}