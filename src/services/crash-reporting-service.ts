import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

interface ErrorContext {
  component?: string;
  action?: string;
  extra?: Record<string, any>;
}

/**
 * Hard Rule: Never transmit screenshot images, file paths, or OCR strings to Sentry.
 */
function sanitizeContext(context?: ErrorContext): Record<string, any> {
  if (!context) return {};
  const cleanExtra: Record<string, any> = {};
  const forbiddenKeywords = ['ocr', 'text', 'filename', 'file_name', 'uri', 'path', 'image', 'photo'];

  if (context.extra) {
    for (const [k, v] of Object.entries(context.extra)) {
      const lower = k.toLowerCase();
      if (!forbiddenKeywords.some((word) => lower.includes(word))) {
        cleanExtra[k] = v;
      }
    }
  }

  return {
    component: context.component || 'UnknownComponent',
    action: context.action || 'UnknownAction',
    platform: Platform.OS,
    extra: cleanExtra,
  };
}

class CrashReportingManager {
  private isInitialized = false;

  public init(): void {
    if (this.isInitialized) return;

    const isLiveDsn =
      SENTRY_DSN &&
      !SENTRY_DSN.includes('your_sentry_dsn') &&
      SENTRY_DSN.startsWith('https://');

    if (isLiveDsn) {
      try {
        Sentry.init({
          dsn: SENTRY_DSN,
          enabled: isLiveDsn,
          debug: __DEV__,
          beforeSend(event) {
            // Strictly scrub any screenshot data or OCR text
            if (event.breadcrumbs) {
              event.breadcrumbs = event.breadcrumbs.map((b) => ({
                ...b,
                message: b.message
                  ? b.message.replace(/(\.png|\.jpg|\.jpeg|file:\/\/|content:\/\/)[^\s]*/gi, '[redacted_path]')
                  : b.message,
              }));
            }
            return event;
          },
        });
      } catch (err) {
        if (__DEV__) console.warn('[CrashReporting] Sentry.init error:', err);
      }
      if (__DEV__) {
        console.log('[CrashReporting] Sentry DSN configured.');
      }
    } else {
      if (__DEV__) {
        console.log('[CrashReporting] Running in development / simulated mode.');
      }
    }

    // Hook unhandled errors safely
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g && g.ErrorUtils) {
      const defaultHandler = g.ErrorUtils.getGlobalHandler();
      g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        this.captureException(error, { action: 'global_unhandled_error', extra: { isFatal } });
        if (defaultHandler) {
          defaultHandler(error, isFatal);
        }
      });
    }

    this.isInitialized = true;
  }

  public captureException(error: any, context?: ErrorContext): void {
    const isLiveDsn =
      SENTRY_DSN &&
      !SENTRY_DSN.includes('your_sentry_dsn') &&
      SENTRY_DSN.startsWith('https://');

    const cleanCtx = sanitizeContext(context);
    const errorMessage = error?.message || String(error);

    if (!isLiveDsn) {
      if (__DEV__) {
        console.warn(`[CrashReporting:Sentry (Simulated)] ${errorMessage}`, cleanCtx);
      }
      return;
    }

    try {
      Sentry.captureException(error, {
        tags: {
          component: cleanCtx.component,
          action: cleanCtx.action,
          platform: Platform.OS,
        },
        extra: cleanCtx.extra,
      });
    } catch (e) {
      if (__DEV__) console.warn('[CrashReporting] Sentry capture error:', e);
    }
  }

  public addBreadcrumb(message: string, category: string = 'navigation'): void {
    if (__DEV__) {
      console.log(`[CrashReporting:Breadcrumb] [${category}] ${message}`);
    }
  }
}

export const CrashReporting = new CrashReportingManager();
