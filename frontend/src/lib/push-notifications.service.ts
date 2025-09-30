
import { Capacitor } from '@capacitor/core';
import {
    PushNotifications,
    Token,
    PushNotificationSchema,
    ActionPerformed,
} from '@capacitor/push-notifications';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const initializePushNotifications = async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
        return;
    }

    const registerTokenOnServer = async (token: string) => {
        try {
            console.log('[PUSH] Rejestrowanie tokena na serwerze:', token.substring(0, 20) + '...');

            const authStore = await import('@/store/auth.store');
            const currentToken = authStore.useAuthStore.getState().token;

            if (!currentToken) {
                toast.error('Nie można zarejestrować urządzenia - brak uwierzytelniania');
                return;
            }

            const response = await api.post('/notifications/register-device', { token });
            console.log('[PUSH] Odpowiedź z serwera:', response.data);
            toast.success('Urządzenie zostało zarejestrowane dla powiadomień');
        } catch (error: unknown) {
            console.error('[PUSH] Błąd podczas rejestracji tokena na serwerze:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: unknown } };
                console.error('[PUSH] Status błędu:', axiosError.response?.status);
                console.error('[PUSH] Dane błędu:', axiosError.response?.data);
                if (axiosError.response?.status === 401) {
                    toast.error('Błąd uwierzytelniania - zaloguj się ponownie');
                } else {
                    toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
                }
            } else {
                toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
            }
        }
    };

    PushNotifications.addListener('registration', (token: Token) => {
        console.log('[PUSH] Otrzymany token:', token.value.substring(0, 20) + '...');
        registerTokenOnServer(token.value);
    });

    PushNotifications.addListener('registrationError', (error: { error: unknown }) => {
        console.error('[PUSH] ❌ Błąd podczas rejestracji w usłudze push:', error);
        toast.error('Nie udało się zarejestrować urządzenia dla powiadomień');
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        toast.info(notification.title || 'Nowe powiadomienie', {
            description: notification.body,
        });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        toast.info('Powiadomienie zostało otwarte');
    });

    try {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
            await PushNotifications.register();
        } else {
            toast.error('Powiadomienia wymagają zgody użytkownika');
        }
    } catch (error) {
        console.error('[PUSH] Błąd podczas inicjalizacji powiadomień:', error);
        toast.error('Błąd podczas inicjalizacji powiadomień');
    }
};
