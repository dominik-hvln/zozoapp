import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    Token,
    PushNotificationSchema,
    ActionPerformed,
} from '@capacitor/push-notifications';
import { api } from '@/lib/api'; // Używamy Twojej istniejącej instancji `api`
import { toast } from 'sonner';

/**
 * Rejestruje token urządzenia na serwerze.
 * @param token Token FCM/APNS otrzymany z urządzenia.
 */
const registerTokenOnServer = async (token: string) => {
    try {
        await api.post('/notifications/register-device', { token });
        console.log('[PUSH] Token urządzenia został pomyślnie zarejestrowany.');
    } catch (error) {
        console.error('[PUSH] Błąd podczas rejestracji tokena na serwerze:', error);
        // Możemy poinformować użytkownika, ale unikajmy natrętnych alertów
        // toast.error('Nie udało się włączyć powiadomień push.');
    }
};

/**
 * Główna funkcja inicjalizująca powiadomienia push.
 */
export const initializePushNotifications = async (): Promise<void> => {
    // Powiadomienia działają tylko w aplikacji natywnej
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    try {
        // 1. Poproś o zgodę
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }
        if (permStatus.receive !== 'granted') {
            // Użytkownik nie wyraził zgody.
            // Możesz w przyszłości dodać tu logikę, np. wyświetlenie informacji w ustawieniach.
            console.warn('[PUSH] Użytkownik nie wyraził zgody na powiadomienia.');
            return;
        }

        // 2. Zarejestruj urządzenie w usłudze Firebase/Apple
        await PushNotifications.register();

        // 3. Nasłuchuj na zdarzenia
        PushNotifications.addListener('registration', (token: Token) => {
            console.log('[PUSH] Rejestracja pomyślna. Token:', token.value);
            registerTokenOnServer(token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('[PUSH] Błąd rejestracji:', JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            console.log('[PUSH] Otrzymano powiadomienie:', notification);
            // Wyświetl powiadomienie jako toast, gdy aplikacja jest otwarta
            toast.info(notification.title || 'Nowe powiadomienie', {
                description: notification.body,
            });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            console.log('[PUSH] Kliknięto w powiadomienie:', action);
            // Tutaj w przyszłości możesz dodać logikę nawigacji
            // np. przekierowanie na stronę ze szczegółami skanu
        });

    } catch (e) {
        console.error('[PUSH] Inicjalizacja nie powiodła się', e);
    }
};