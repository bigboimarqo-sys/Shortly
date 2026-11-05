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

    // Dispatch to Sentry Ingest Store API via standard Sentry envelope / store format
    try {
      const dsnUrl = new URL(SENTRY_DSN);
      const projectId = dsnUrl.pathname.replace(/^\//, '');
      const publicKey = dsnUrl.username;
      const sentryHost = dsnUrl.host;

      const envelopeEndpoint = `https://${sentryHost}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}&sentry_client=shotly-react-native%2F1.0.0`;

      fetch(envelopeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: Math.random().toString(36).substring(2, 18),
          timestamp: new Date().toISOString(),
          platform: 'javascript',
          level: 'error',
          logger: 'shotly',
          release: 'shotly@1.0.0',
          exception: {
            values: [
              {
                type: error?.name || 'Error',
                value: errorMessage,
                stacktrace: error?.stack ? { frames: [{ filename: 'app.js', lineno: 1 }] } : undefined,
              },
            ],
          },
          tags: {
            platform: Platform.OS,
            component: cleanCtx.component,
          },
          extra: cleanCtx.extra,
        }),
      }).catch((e) => {
        if (__DEV__) console.warn('[CrashReporting] Sentry network error:', e);
      });
    } catch (e) {
      // Never crash the host app if reporting fails
    }
  }

  public addBreadcrumb(message: string, category: string = 'navigation'): void {
    if (__DEV__) {
      console.log(`[CrashReporting:Breadcrumb] [${category}] ${message}`);
    }
  }
}

export const CrashReporting = new CrashReportingManager();
