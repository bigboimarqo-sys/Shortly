import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library/legacy';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const PERMISSION_STORAGE_KEY = '@shotly_photo_permissions';

export type PhotoPermissionStatus = 'granted' | 'limited' | 'denied' | 'undetermined';

export function usePhotoPermissions() {
  const [status, setStatus] = useState<PhotoPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      // 1. Check local cached status first
      const stored = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY);
      if (stored === 'granted' || stored === 'limited' || stored === 'denied') {
        setStatus(stored as PhotoPermissionStatus);
      }

      // 2. On native platforms, query expo-media-library with granular 'photo' permission
      if (Platform.OS !== 'web') {
        // Specifying ['photo'] prevents Android from requesting undeclared AUDIO permission
        const response = await MediaLibrary.getPermissionsAsync(false, ['photo']);
        const accessPrivileges = response.accessPrivileges;

        if (response.granted) {
          const newStatus: PhotoPermissionStatus =
            accessPrivileges === 'limited' ? 'limited' : 'granted';
          setStatus(newStatus);
          await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, newStatus);
        } else if (response.status === 'denied') {
          if (stored !== 'granted' && stored !== 'limited') {
            setStatus('denied');
            await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied');
          }
        }
      } else {
        if (!stored) {
          setStatus('undetermined');
        }
      }
    } catch (err) {
      console.warn('Error checking photo permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestFullAccess = async (): Promise<PhotoPermissionStatus> => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Browser fallback: simulated approval for web demonstration
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
        setStatus('granted');
        return 'granted';
      }

      // Request explicitly only 'photo' permission
      const response = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      let newStatus: PhotoPermissionStatus = 'denied';
      const accessPrivileges = response.accessPrivileges;

      if (response.granted) {
        newStatus = accessPrivileges === 'limited' ? 'limited' : 'granted';
      } else if (response.status === 'granted') {
        newStatus = 'granted';
      } else {
        newStatus = 'denied';
      }

      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, newStatus);
      setStatus(newStatus);
      return newStatus;
    } catch (err) {
      console.warn('Error requesting full photo access:', err);
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'granted');
      setStatus('granted');
      return 'granted';
    } finally {
      setIsLoading(false);
    }
  };

  const requestLimitedAccess = async (): Promise<PhotoPermissionStatus> => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        if (typeof MediaLibrary.presentPermissionsPickerAsync === 'function') {
          await MediaLibrary.presentPermissionsPickerAsync(['photo']);
        } else {
          await MediaLibrary.requestPermissionsAsync(false, ['photo']);
        }
      } else if (Platform.OS !== 'web') {
        await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      }

      const newStatus: PhotoPermissionStatus = 'limited';
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, newStatus);
      setStatus(newStatus);
      return newStatus;
    } catch (err) {
      console.warn('Error requesting limited photo access:', err);
      await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'limited');
      setStatus('limited');
      return 'limited';
    } finally {
      setIsLoading(false);
    }
  };

  const resetPermissions = async () => {
    await AsyncStorage.removeItem(PERMISSION_STORAGE_KEY);
    setStatus('undetermined');
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
