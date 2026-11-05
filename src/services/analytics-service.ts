import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
const DISTINCT_ID_STORAGE_KEY = '@shotly_analytics_distinct_id';

/**
 * Hard Rule: Never send screenshot images, file paths, or OCR text to external analytics.
 * All properties are sanitized through this shield before sending to PostHog.
 */
function sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
  if (!properties) return {};

  const sanitized: Record<string, any> = {};
  const forbiddenKeywords = ['ocr', 'text', 'filename', 'file_name', 'uri', 'path', 'image', 'photo'];

  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase();
    const isForbidden = forbiddenKeywords.some((word) => lowerKey.includes(word));
    if (!isForbidden) {
      sanitized[key] = value;
    }
  }

  return {
    ...sanitized,
    platform: Platform.OS,
    app_version: '1.0.0',
  };
}

class AnalyticsServiceManager {
  private distinctId: string | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      let id = await AsyncStorage.getItem(DISTINCT_ID_STORAGE_KEY);
      if (!id) {
        id = `shotly_user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await AsyncStorage.setItem(DISTINCT_ID_STORAGE_KEY, id);
      }
      this.distinctId = id;
      this.isInitialized = true;
    } catch (e) {
      this.distinctId = `anonymous_${Date.now()}`;
      this.isInitialized = true;
    }
  }

  public async identify(userId: string): Promise<void> {
    if (!userId) return;
    this.distinctId = userId;
    try {
      await AsyncStorage.setItem(DISTINCT_ID_STORAGE_KEY, userId);
    } catch (e) {
      // ignore
    }
  }

  public async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const isLiveKey =
      POSTHOG_API_KEY &&
      !POSTHOG_API_KEY.includes('your_posthog_api_key') &&
      POSTHOG_API_KEY.startsWith('phc_');

    const cleanProps = sanitizeProperties(properties);

    if (!isLiveKey) {
      if (__DEV__) {
        console.log(`[Analytics:PostHog (Simulated)] Event: "${eventName}"`, cleanProps);
      }
      return;
    }

    try {
      // Lightweight HTTP capture without heavy external native dependencies
      await fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: POSTHOG_API_KEY,
          event: eventName,
          properties: {
            ...cleanProps,
            distinct_id: this.distinctId,
            $lib: 'shotly-client',
          },
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      // Offline-first: analytics failures never crash the app
      if (__DEV__) {
        console.warn('[Analytics] PostHog dispatch skipped/offline:', err);
      }
    }
  }
}

export const AnalyticsService = new AnalyticsServiceManager();
