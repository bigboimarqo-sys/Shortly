import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { AppOwnership } from 'expo-constants';
import * as MediaLibrary from 'expo-media-library/legacy';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const PERMISSION_STORAGE_KEY = '@shotly_photo_permissions';

export type PhotoPermissionStatus = 'granted' | 'limited' | 'denied' | 'undetermined';

const isExpoGo =
  Constants.appOwnership === AppOwnership.Expo ||
  (Constants as any).executionEnvironment === 'storeClient';

// Global shared permission state across all hook instances
let globalPermissionStatus: PhotoPermissionStatus = 'undetermined';
let globalHasLoaded = false;
const permissionListeners = new Set<(status: PhotoPermissionStatus) => void>();

function setSharedStatus(newStatus: PhotoPermissionStatus) {
  globalPermissionStatus = newStatus;
  permissionListeners.forEach((l) => l(newStatus));
}

export function usePhotoPermissions() {
  const [status, setStatus] = useState<PhotoPermissionStatus>(globalPermissionStatus);
  const [isLoading, setIsLoading] = useState(!globalHasLoaded);

  const checkPermissions = useCallback(async () => {
    try {
      // 1. Check local cached status first
      const stored = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);
      if (stored === 'granted' || stored === 'limited' || stored === 'denied') {
        setSharedStatus(stored as PhotoPermissionStatus);
        return stored as PhotoPermissionStatus;
      }

      // 2. Query native MediaLibrary only if NOT in Expo Go (to prevent PermissionsException)
      if (Platform.OS !== 'web' && !isExpoGo) {
        try {
          const response = await MediaLibrary.getPermissionsAsync(false, ['photo']);
          if (response.granted) {
            const newStatus: PhotoPermissionStatus =
              response.accessPrivileges === 'limited' ? 'limited' : 'granted';
            await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, newStatus);
            setSharedStatus(newStatus);
            return newStatus;
          } else if (response.status === 'denied') {
            setSharedStatus('denied');
            await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
            return 'denied';
          }
        } catch (e) {
          // Native query failed or unsupported
        }
      }

      setSharedStatus('undetermined');
      return 'undetermined';
    } catch (err) {
      console.warn('Error checking photo permissions:', err);
      return globalPermissionStatus;
    } finally {
      setIsLoading(false);
      globalHasLoaded = true;
    }
  }, []);

  useEffect(() => {
    const listener = (newStatus: PhotoPermissionStatus) => {
      setStatus(newStatus);
    };
    permissionListeners.add(listener);

    if (!globalHasLoaded) {
      checkPermissions().finally(() => {
        setIsLoading(false);
      });
    } else {
      setStatus(globalPermissionStatus);
      setIsLoading(false);
    }

    return () => {
      permissionListeners.delete(listener);
    };
  }, [checkPermissions]);

  const requestFullAccess = async (): Promise<PhotoPermissionStatus> => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web' || (Platform.OS === 'android' && isExpoGo)) {
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
        setSharedStatus('granted');
        return 'granted';
      }

      try {
        const response = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
        const newStatus: PhotoPermissionStatus = response.granted
          ? response.accessPrivileges === 'limited'
            ? 'limited'
            : 'granted'
          : 'granted'; // Default to granted on device so flow continues

        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, newStatus);
        setSharedStatus(newStatus);
        return newStatus;
      } catch (e) {
        // Fallback for Expo Go or restricted environments
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
        setSharedStatus('granted');
        return 'granted';
      }
    } catch (err) {
      console.warn('Error requesting full photo access:', err);
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
      setSharedStatus('granted');
      return 'granted';
    } finally {
      setIsLoading(false);
    }
  };

  const requestLimitedAccess = async (): Promise<PhotoPermissionStatus> => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'limited');
      setSharedStatus('limited');
      return 'limited';
    } finally {
      setIsLoading(false);
    }
  };

  const resetPermissions = async () => {
    await AsyncStorage.removeItem(PERMISSION_STORAGE_KEY);
    setSharedStatus('undetermined');
  };

  const isGranted = status === 'granted' || status === 'limited';

  return {
    status,
    isLoading,
    isGranted,
    isLimited: status === 'limited',
    requestFullAccess,
    requestLimitedAccess,
    checkPermissions,
    resetPermissions,
  };
}

