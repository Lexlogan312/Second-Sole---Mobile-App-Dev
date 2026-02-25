import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export interface BiometricResult {
    success: boolean;
    error?: string;
    code?: string;
}

/**
 * Returns whether the device has biometric hardware available and enrolled.
 */
export const checkBiometricAvailability = async (): Promise<{
    available: boolean;
    biometryType: BiometryType;
}> => {
    // On web, always simulate as available
    if (!Capacitor.isNativePlatform()) {
        return { available: true, biometryType: BiometryType.none };
    }
    try {
        const { isAvailable, biometryType } = await BiometricAuth.checkBiometry();
        return { available: isAvailable, biometryType };
    } catch {
        return { available: false, biometryType: BiometryType.none };
    }
};

/**
 * Triggers the native Face ID / fingerprint / face auth prompt.
 * On web (Vite dev), simulates success immediately.
 */
export const authenticate = async (
    reason: string = 'Authenticate to access your profile'
): Promise<BiometricResult> => {
    // Web simulation
    if (!Capacitor.isNativePlatform()) {
        return { success: true };
    }

    try {
        await BiometricAuth.authenticate({
            reason,
            cancelTitle: 'Use Password',
            allowDeviceCredential: false,
        });
        return { success: true };
    } catch (e: any) {
        return {
            success: false,
            error: e?.message ?? 'Biometric authentication failed',
            code: e?.code ?? '',
        };
    }
};

/**
 * Returns a user-facing label for the available biometry type.
 */
export const getBiometryLabel = (type: BiometryType): string => {
    switch (type) {
        case BiometryType.faceId: return 'Face ID';
        case BiometryType.touchId: return 'Touch ID';
        case BiometryType.faceAuthentication: return 'Face Unlock';
        case BiometryType.fingerprintAuthentication: return 'Fingerprint';
        case BiometryType.irisAuthentication: return 'Iris Scan';
        default: return 'Biometrics';
    }
};
