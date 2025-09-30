import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

const SERVER = 'pl.appity.zozoapp';
const PREF_KEY = 'bio_prompt_state';
const DECLINE_COOLDOWN_DAYS = 90;

type BiometricCheck = {
    available: boolean;
    biometryType?: BiometryType;
    errorCode?: number;
};

export function getBiometricErrorCode(err: unknown): number | undefined {
    if (typeof err === 'object' && err !== null) {
        const rec = err as Record<string, unknown>;
        if (typeof rec.errorCode === 'number') return rec.errorCode;
        if (typeof rec.code === 'number') return rec.code as number;
    }
    return undefined;
}

export async function checkBiometrics(useFallback = true): Promise<BiometricCheck> {
    try {
        const res = await NativeBiometric.isAvailable({ useFallback });
        return { available: res.isAvailable, biometryType: res.biometryType };
    } catch (err: unknown) {
        return { available: false, errorCode: getBiometricErrorCode(err) };
    }
}

export async function getSavedCredentials():
    Promise<{ email: string; hasPassword: boolean } | null> {
    try {
        const { username, password } = await NativeBiometric.getCredentials({ server: SERVER });
        if (!username) return null;
        return { email: username, hasPassword: !!password };
    } catch {
        return null;
    }
}

export async function saveCredentials(email: string, password: string): Promise<boolean> {
    const { available } = await checkBiometrics(true);
    if (!available) return false;

    await NativeBiometric.setCredentials({ username: email, password, server: SERVER });
    await Preferences.remove({ key: PREF_KEY });
    return true;
}

export async function shouldPromptToSave(currentEmail: string): Promise<boolean> {
    const { available } = await checkBiometrics(true);
    if (!available) return false;
    const pref = await Preferences.get({ key: PREF_KEY });
    if (pref.value) {
        try {
            const { declinedAt } = JSON.parse(pref.value) as { declinedAt?: number };
            if (declinedAt) {
                const daysSince = (Date.now() - declinedAt) / (1000 * 60 * 60 * 24);
                if (daysSince < DECLINE_COOLDOWN_DAYS) return false;
            }
        } catch {/* ignore */}
    }

    const saved = await getSavedCredentials();
    if (saved && saved.email === currentEmail) {
        return false;
    }

    return true;
}

export async function markPromptDeclined(): Promise<void> {
    await Preferences.set({ key: PREF_KEY, value: JSON.stringify({ declinedAt: Date.now() }) });
}

export async function autofillWithBiometrics():
    Promise<{ email: string; password: string } | null> {
    const { available } = await checkBiometrics(true);
    if (!available) return null;

    await NativeBiometric.verifyIdentity({
        reason: 'Autouzupełnij zapisane dane',
        title: 'Uwierzytelnij się',
        subtitle: 'Face ID / Touch ID / Android Biometrics',
        description: 'Potwierdź tożsamość, aby wypełnić formularz',
        useFallback: true,
        fallbackTitle: 'Użyj kodu urządzenia',
        maxAttempts: 3,
    });

    const { username, password } = await NativeBiometric.getCredentials({ server: SERVER });
    if (!username || !password) return null;
    return { email: username, password };
}

export async function deleteSavedCredentials(): Promise<void> {
    try { await NativeBiometric.deleteCredentials({ server: SERVER }); } catch {}
}

export function humanizeBiometricError(code?: number): string {
    switch (code) {
        case 1: return 'Biometria niedostępna na tym urządzeniu.';
        case 3: return 'Na urządzeniu nie skonfigurowano biometrii.';
        case 4: return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
        case 10: return 'Uwierzytelnianie nie powiodło się.';
        case 14: return 'Brak kodu urządzenia/hasła systemowego.';
        case 16: return 'Operacja anulowana przez użytkownika.';
        case 17: return 'Wybrano metodę awaryjną (fallback).';
        default: return 'Nie udało się potwierdzić tożsamości.';
    }
}
