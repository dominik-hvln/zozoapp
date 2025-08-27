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
        console.log('[PUSH] Nie jest to platforma natywna, pomijamy inicjalizację push notifications');
        return;
    }

    console.log('[PUSH] Inicjalizacja powiadomień push...');

    const registerTokenOnServer = async (token: string) => {
        try {
            console.log('[PUSH] Rejestrowanie tokena na serwerze:', token.substring(0, 20) + '...');

            // Sprawdź, czy użytkownik jest zalogowany
            const authStore = await import('@/store/auth.store');
            const currentToken = authStore.useAuthStore.getState().token;

            if (!currentToken) {
                console.error('[PUSH] Brak tokena uwierzytelniania - użytkownik nie jest zalogowany');
                toast.error('Nie można zarejestrować urządzenia - brak uwierzytelniania');
                return;
            }

            console.log('[PUSH] Wysyłanie żądania do /notifications/register-device...');
            const response = await api.post('/notifications/register-device', { token });
            console.log('[PUSH] Odpowiedź z serwera:', response.data);
            console.log('[PUSH] Token pomyślnie zarejestrowany na serwerze');
            toast.success('Urządzenie zostało zarejestrowane dla powiadomień');
        } catch (error: unknown) {
            console.error('[PUSH] Błąd podczas rejestracji tokena na serwerze:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: unknown } };
                console.error('[PUSH] Status błędu:', axiosError.response?.status);
                console.error('[PUSH] Dane błędu:', axiosError.response?.data);
                if (axiosError.response?.status === 401) {
                    console.error('[PUSH] Błąd uwierzytelniania - token JWT może być nieprawidłowy');
                    toast.error('Błąd uwierzytelniania - zaloguj się ponownie');
                } else {
                    toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
                }
            } else {
                toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
            }
        }
    };

    // 1. Poproś o zgodę
    console.log('[PUSH] Proszę o zgodę na powiadomienia...');
    PushNotifications.requestPermissions().then(result => {
        console.log('[PUSH] Wynik zapytania o zgodę:', result);
        if (result.receive === 'granted') {
            console.log('[PUSH] Zgoda udzielona, rejestrowanie urządzenia...');
            // 2. Jeśli jest zgoda, zarejestruj urządzenie
            PushNotifications.register();
        } else {
            console.warn('[PUSH] Użytkownik nie wyraził zgody na powiadomienia:', result);
            toast.error('Powiadomienia wymagają zgody użytkownika');
        }
    }).catch(error => {
        console.error('[PUSH] Błąd podczas proszenia o zgodę:', error);
    });

    // Listener: sukces rejestracji
    PushNotifications.addListener('registration', (token: Token) => {
        console.log('[PUSH] Rejestracja w usłudze push (FCM/APNS) pomyślna');
        console.log('[PUSH] Otrzymany token:', token.value.substring(0, 20) + '...');
        console.log('[PUSH] Pełny token FCM:', token.value);
        // 3. Wyślij token na swój backend
        registerTokenOnServer(token.value);
    });

    // Listener: błąd rejestracji
    PushNotifications.addListener('registrationError', (error: { error: unknown }) => {
        console.error('[PUSH] Błąd podczas rejestracji w usłudze push:', error);
        toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
    });

    // Listener: otrzymano powiadomienie, gdy aplikacja jest otwarta
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[PUSH] Otrzymano powiadomienie w foreground:', notification);
        toast.info(notification.title || 'Nowe powiadomienie', {
            description: notification.body,
        });
    });

    // Listener: kliknięto w powiadomienie
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[PUSH] Akcja na powiadomieniu wykonana:', action);
        console.log('[PUSH] Dane powiadomienia:', action.notification);
        // Tutaj możesz dodać nawigację do konkretnego ekranu
        toast.info('Powiadomienie zostało otwarte');
    });
};