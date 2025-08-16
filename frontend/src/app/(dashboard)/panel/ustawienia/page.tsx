'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function NotificationsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Powiadomienia i preferencje</CardTitle>
                <CardDescription>Zarządzaj tym, jak i kiedy się z Tobą komunikujemy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="notifyScan" className="font-medium">Powiadomienie o zeskanowaniu tatuażu</Label>
                    <Switch id="notifyScan" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="notifyExpired" className="font-medium">Powiadomienie o wygasającym tatuażu</Label>
                    <Switch id="notifyExpired" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="notifyPromotions" className="font-medium">Powiadomienia o promocjach i nowościach</Label>
                    <Switch id="notifyPromotions" />
                </div>
            </CardContent>
        </Card>
    );
}