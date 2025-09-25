import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

const SERVER = 'pl.appity.zozoapp'; // stały identyfikator Keychain/Keystore

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

/** Krok 2: zapis po udanym logowaniu (bez verifyIdentity) */
export async function saveCredentials(email: string, password: string): Promise<boolean> {
    const { available } = await checkBiometrics(true);
    if (!available) return false;

    await NativeBiometric.setCredentials({
        username: email,
        password,
        server: SERVER,
    });
    return true;
}

/** Krok 3: autouzupełnienie po biometrii (z ewentualnym fallbackiem na kod urządzenia) */
export async function autofillWithBiometrics(): Promise<{ email: string; password: string } | null> {
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
    try {
        await NativeBiometric.deleteCredentials({ server: SERVER });
    } catch {
        /* ignore */
    }
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
