import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface VaultAuthResult {
  success: boolean;
  error?: string;
  isBiometric?: boolean;
}

export const VaultAuthService = {
  /**
   * Check if the device hardware supports biometrics (Face ID, Touch ID, or Android Fingerprint)
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  },

  /**
   * Authenticate user to unlock the Private Vault
   */
  async authenticateVault(): Promise<VaultAuthResult> {
    if (Platform.OS === 'web') {
      // Immediate access for web environment
      return { success: true, isBiometric: false };
    }

    try {
      const isAvailable = await this.isBiometricAvailable();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Shotly Private Vault',
        fallbackLabel: 'Use Device PIN / Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true, isBiometric: isAvailable };
      }

      return {
        success: false,
        error: result.error || 'Authentication cancelled',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Biometric authentication failed',
      };
    }
  },
};
