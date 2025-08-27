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
    console.log('[PUSH] Inicjalizacja powiadomień push po zalogowaniu...');

    // Prośba o zgodę
    PushNotifications.requestPermissions().then(result => {
        console.log('[PUSH] Wynik zapytania o zgodę:', result);
        if (result.receive === 'granted') {
            console.log('[PUSH] Zgoda udzielona, rejestrowanie urządzenia...');
            PushNotifications.register();
        } else {
            console.warn('[PUSH] Użytkownik nie wyraził zgody na powiadomienia:', result);
            toast.error('Powiadomienia wymagają zgody użytkownika');
        }
    }).catch(error => {
        console.error('[PUSH] Błąd podczas proszenia o zgodę:', error);
    });
    // Listener: sukces rejestracji tokena
    PushNotifications.addListener('registration', (token: Token) => {
        console.log('[PUSH] Rejestracja w usłudze push (FCM/APNS) pomyślna');
        console.log('[PUSH] Otrzymany token:', token.value.substring(0, 20) + '...');
        console.log('[PUSH] Pełny token FCM:', token.value);
        // Zapisz token na serwerze
        registerTokenOnServer(token.value);
    });
    // Listener: błąd rejestracji
    PushNotifications.addListener('registrationError', (error: { error: unknown }) => {
        console.error('[PUSH] Błąd podczas rejestracji w usłudze push:', error);
        toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
    });
};
// Funkcja do rejestracji tokena na serwerze
const registerTokenOnServer = async (token: string) => {
    try {
        console.log('[PUSH] Rejestrowanie tokena na serwerze:', token.substring(0, 20) + '...');

        const authStore = await import('@/store/auth.store');
        const currentToken = authStore.useAuthStore.getState().token;

        if (!currentToken) {
            console.error('[PUSH] Brak tokena uwierzytelniania - użytkownik nie jest zalogowany');
            toast.error('Nie można zarejestrować urządzenia - brak uwierzytelniania');
            return;
        }

        const response = await api.post('/notifications/register-device', { token });
        console.log('[PUSH] Token pomyślnie zarejestrowany na serwerze:', response.data);
        toast.success('Urządzenie zostało zarejestrowane dla powiadomień');
    } catch (error: unknown) {
        console.error('[PUSH] Błąd podczas rejestracji tokena na serwerze:', error);
    }
};