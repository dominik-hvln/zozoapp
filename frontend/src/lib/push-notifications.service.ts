import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    Token,
    PushNotificationSchema,
    ActionPerformed,
} from '@capacitor/push-notifications';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const initializePushNotifications = (): void => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    const registerTokenOnServer = async (token: string) => {
        try {
            await api.post('/notifications/register-device', { token });
            console.log('[PUSH] Token pomyślnie zarejestrowany na serwerze:', token);
        } catch (error) {
            console.error('[PUSH] Błąd podczas rejestracji tokena na serwerze:', error);
        }
    };

    // 1. Poproś o zgodę
    PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
            // 2. Jeśli jest zgoda, zarejestruj urządzenie
            PushNotifications.register();
        } else {
            // Użytkownik nie wyraził zgody
            console.warn('[PUSH] Użytkownik nie wyraził zgody na powiadomienia.');
        }
    });

    // Listener: sukces rejestracji
    PushNotifications.addListener('registration', (token: Token) => {
        console.log('[PUSH] Rejestracja w usłudze push (FCM/APNS) pomyślna.');
        // 3. Wyślij token na swój backend
        registerTokenOnServer(token.value);
    });

    // Listener: błąd rejestracji
    PushNotifications.addListener('registrationError', (error: { error: unknown }) => {
        console.error('[PUSH] Błąd podczas rejestracji w usłudze push:', error);
    });

    // Listener: otrzymano powiadomienie, gdy aplikacja jest otwarta
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[PUSH] Otrzymano powiadomienie:', notification);
        toast.info(notification.title || 'Nowe powiadomienie', {
            description: notification.body,
        });
    });

    // Listener: kliknięto w powiadomienie
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[PUSH] Akcja na powiadomieniu wykonana:', action);
        // Tutaj możesz dodać nawigację do konkretnego ekranu
    });
};