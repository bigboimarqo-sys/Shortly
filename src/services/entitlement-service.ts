import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUBSCRIPTION_STORAGE_KEY = '@shotly_subscription_record';
export const FREE_MODE_START_KEY = '@shotly_free_mode_start_time';

export const FREE_SCREENSHOT_LIMIT = 100;
export const FREE_MODE_DAYS = 7;

export type SubscriptionPlan =
  | 'free'
  | 'plus_annual'
  | 'plus_monthly'
  | 'pro_annual'
  | 'pro_monthly'
  | 'team_monthly';

export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'expired';

// Explicitly cards and wallets only; NO instant EFT!
export type AllowedPaymentMethod = 'card' | 'apple_pay' | 'google_pay';

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  category: 'Free' | 'Plus' | 'Pro' | 'Team';
  priceZAR: string;
  priceAmount: number;
  period: 'free' | 'year' | 'month';
  includes: string;
  badge?: string;
  hasTrial: boolean;
  trialDays: number;
  screenshotLimit: number; // 100 for Free, Infinity for others
}

export const SUBSCRIPTION_MODEL: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    category: 'Free',
    priceZAR: 'R0',
    priceAmount: 0,
    period: 'free',
    includes: 'Auto-capture, OCR search, 100 screenshots',
    hasTrial: false,
    trialDays: 7, // Free mode runs for 7 days
    screenshotLimit: 100,
  },
  {
    id: 'plus_annual',
    name: 'Plus Annual',
    category: 'Plus',
    priceZAR: 'R349 / year',
    priceAmount: 349,
    period: 'year',
    includes: 'Unlimited library, clean-up, Private Vault',
    badge: 'Best value',
    hasTrial: true,
    trialDays: 7,
    screenshotLimit: Infinity,
  },
  {
    id: 'plus_monthly',
    name: 'Plus Monthly',
    category: 'Plus',
    priceZAR: 'R39 / month',
    priceAmount: 39,
    period: 'month',
    includes: 'Unlimited library, clean-up, Private Vault',
    hasTrial: true,
    trialDays: 7,
    screenshotLimit: Infinity,
  },
  {
    id: 'pro_annual',
    name: 'Pro Annual',
    category: 'Pro',
    priceZAR: 'R699 / year',
    priceAmount: 699,
    period: 'year',
    includes: 'Cloud sync, Receipt Tracker, Smart Actions',
    badge: 'Pro features',
    hasTrial: true,
    trialDays: 7,
    screenshotLimit: Infinity,
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    category: 'Pro',
    priceZAR: 'R79 / month',
    priceAmount: 79,
    period: 'month',
    includes: 'Cloud sync, Receipt Tracker, Smart Actions',
    hasTrial: true,
    trialDays: 7,
    screenshotLimit: Infinity,
  },
  {
    id: 'team_monthly',
    name: 'Team (5 seats)',
    category: 'Team',
    priceZAR: 'R149 / month',
    priceAmount: 149,
    period: 'month',
    includes: 'Pro plus shared collections (5 seats)',
    badge: 'For teams',
    hasTrial: true,
    trialDays: 7,
    screenshotLimit: Infinity,
  },
];

export interface SubscriptionRecord {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiry: number; // Unix timestamp ms
  providerReference: string; // e.g., 'rc_sb_annual_98124'
  trialEnd?: number; // Unix timestamp ms (7 days for card/wallet trials)
  paymentMethod?: AllowedPaymentMethod;
  currency: 'ZAR';
  price: number; // 349, 39, 699, 79, 149 in ZAR
  updatedAt: number;
}

export type SandboxPaymentScenario =
  | 'success'
  | 'declined'
  | 'cancelled'
  | 'failed';

export interface PaymentResult {
  success: boolean;
  scenario: SandboxPaymentScenario;
  record?: SubscriptionRecord;
  error?: string;
  message?: string;
}

// In-memory cache for fast synchronous checks
let cachedRecord: SubscriptionRecord | null = null;
let cachedFreeStartTime: number = Date.now();
const entitlementListeners = new Set<(record: SubscriptionRecord) => void>();

export const DEFAULT_FREE_RECORD: SubscriptionRecord = {
  plan: 'free',
  status: 'none',
  expiry: 0,
  providerReference: 'none',
  currency: 'ZAR',
  price: 0,
  updatedAt: Date.now(),
};

/**
 * EntitlementService:
 * Hard privacy rule: Never log or store payment details (cards, CVVs, account numbers).
 * Stores only plan, status, expiry, provider reference and currency in ZAR.
 * 
 * Subscription Model:
 * • Free: R0 (Auto-capture, OCR search, 100 screenshots — 7-day free mode)
 * • Plus: R39 / month or R349 / year (Unlimited library, clean-up, Private Vault)
 * • Pro: R79 / month or R699 / year (Cloud sync, Receipt Tracker, Smart Actions)
 * • Team: R149 / month, 5 seats (Pro plus shared collections)
 * 7-day free trial on all paid plans (Card, Apple Pay, Google Pay). Instant EFT disallowed.
 */
export const EntitlementService = {
  /**
   * Initialize and load cached subscription state + free mode start timestamp
   */
  async loadSubscription(): Promise<SubscriptionRecord> {
    try {
      // 1. Load Free Mode Start Time (runs for 7 days)
      const rawFreeStart = await AsyncStorage.getItem(FREE_MODE_START_KEY);
      if (rawFreeStart) {
        cachedFreeStartTime = parseInt(rawFreeStart, 10) || Date.now();
      } else {
        cachedFreeStartTime = Date.now();
        await AsyncStorage.setItem(FREE_MODE_START_KEY, cachedFreeStartTime.toString());
      }

      // 2. Load Subscription Record
      const raw = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (raw) {
        const parsed: SubscriptionRecord = JSON.parse(raw);
        // Verify expiry
        if (parsed.expiry > 0 && parsed.expiry < Date.now()) {
          parsed.status = 'expired';
          await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(parsed));
        }
        cachedRecord = parsed;
        this.notifyListeners(parsed);
        return parsed;
      }
    } catch (err) {
      console.warn('Failed to load subscription record:', err);
    }
    cachedRecord = DEFAULT_FREE_RECORD;
    return DEFAULT_FREE_RECORD;
  },

  /**
   * Fast check if the user is currently entitled to paid features (Plus, Pro, or Team)
   */
  isPlusActive(): boolean {
    if (!cachedRecord) return false;
    const isPaidPlan =
      cachedRecord.plan === 'plus_annual' ||
      cachedRecord.plan === 'plus_monthly' ||
      cachedRecord.plan === 'pro_annual' ||
      cachedRecord.plan === 'pro_monthly' ||
      cachedRecord.plan === 'team_monthly';
    const isStatusValid =
      cachedRecord.status === 'active' || cachedRecord.status === 'trialing';
    const notExpired = cachedRecord.expiry > Date.now();
    return isPaidPlan && isStatusValid && notExpired;
  },

  /**
   * Current cached subscription record
   */
  getRecord(): SubscriptionRecord {
    return cachedRecord || DEFAULT_FREE_RECORD;
  },

  /**
   * Days remaining in the 7-day paid trial (if trialing on card/wallets)
   */
  getRemainingTrialDays(): number {
    if (!cachedRecord || cachedRecord.status !== 'trialing' || !cachedRecord.trialEnd) {
      return 0;
    }
    const diffMs = cachedRecord.trialEnd - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  },

  /**
   * Days remaining in the 7-day Free mode
   */
  getRemainingFreeDays(): number {
    if (this.isPlusActive()) return 0;
    const freeEnd = cachedFreeStartTime + FREE_MODE_DAYS * 24 * 60 * 60 * 1000;
    const diffMs = freeEnd - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  },

  /**
   * Checks if the 7-day Free mode has expired
   */
  isFreeModeExpired(): boolean {
    if (this.isPlusActive()) return false;
    const freeEnd = cachedFreeStartTime + FREE_MODE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() > freeEnd;
  },

  /**
   * Validates if the user can import/add more screenshots given their plan and limits.
   * Free mode: 100 screenshots max & 7-day mode limit.
   * Paid tiers: Unlimited.
   */
  checkScreenshotLimit(currentCount: number): {
    allowed: boolean;
    limit: number;
    remaining: number;
    isFreeExpired: boolean;
    message?: string;
  } {
    if (this.isPlusActive()) {
      return {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        isFreeExpired: false,
      };
    }

    // Check 7-day free mode expiration
    if (this.isFreeModeExpired()) {
      return {
        allowed: false,
        limit: FREE_SCREENSHOT_LIMIT,
        remaining: 0,
        isFreeExpired: true,
        message:
          'Your 7-day Free plan has ended. Upgrade to Shotly Plus to continue scanning and organising screenshots!',
      };
    }

    // Check 100 screenshot capacity
    if (currentCount >= FREE_SCREENSHOT_LIMIT) {
      return {
        allowed: false,
        limit: FREE_SCREENSHOT_LIMIT,
        remaining: 0,
        isFreeExpired: false,
        message: `Free plan limit reached (${FREE_SCREENSHOT_LIMIT} screenshots). Upgrade to Shotly Plus for unlimited library & clean-up!`,
      };
    }

    return {
      allowed: true,
      limit: FREE_SCREENSHOT_LIMIT,
      remaining: Math.max(0, FREE_SCREENSHOT_LIMIT - currentCount),
      isFreeExpired: false,
    };
  },

  /**
   * Save subscription record.
   * HARD RULE: Only stores plan, status, expiry, and providerReference.
   * NEVER stores or logs payment card numbers, CVVs, or bank credentials.
   */
  async saveRecord(record: SubscriptionRecord): Promise<void> {
    cachedRecord = record;
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(record));
    } catch (err) {
      console.warn('Error saving subscription record:', err);
    }
    this.notifyListeners(record);
  },

  /**
   * Starts a 7-day free trial on Card or Wallets (Google Pay / Apple Pay)
   * for any paid plan in the Subscription Model. Instant EFT disallowed.
   */
  async activateTrial(
    plan: SubscriptionPlan,
    paymentMethod: AllowedPaymentMethod = 'card'
  ): Promise<SubscriptionRecord> {
    if (plan === 'free') {
      return DEFAULT_FREE_RECORD;
    }

    const planDetail = SUBSCRIPTION_MODEL.find((p) => p.id === plan);
    const trialDays = planDetail?.trialDays ?? 7;
    const now = Date.now();
    const trialEnd = now + trialDays * 24 * 60 * 60 * 1000;
    const price = planDetail?.priceAmount ?? 349;
    const providerReference = `shotly_trial_${plan}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    const newRecord: SubscriptionRecord = {
      plan,
      status: 'trialing',
      expiry: trialEnd,
      trialEnd,
      providerReference,
      paymentMethod,
      currency: 'ZAR',
      price,
      updatedAt: now,
    };

    await this.saveRecord(newRecord);
    return newRecord;
  },

  /**
   * Sandbox payment simulator supporting all checkout outcomes:
   * 1. 'success': 7-day trial activated on Card/Wallets
   * 2. 'declined': Card / bank declined payment
   * 3. 'cancelled': User dismissed the checkout flow
   * 4. 'failed': Network or provider timeout
   */
  async simulateSandboxCheckout(
    scenario: SandboxPaymentScenario,
    plan: SubscriptionPlan,
    paymentMethod: AllowedPaymentMethod = 'card'
  ): Promise<PaymentResult> {
    // Artificial slight delay to simulate real sandbox network call
    await new Promise((r) => setTimeout(r, 600));

    switch (scenario) {
      case 'success': {
        const record = await this.activateTrial(plan, paymentMethod);
        const planDetail = SUBSCRIPTION_MODEL.find((p) => p.id === plan);
        return {
          success: true,
          scenario: 'success',
          record,
          message: `7-Day Free Trial activated successfully on ${
            paymentMethod === 'apple_pay'
              ? 'Apple Pay'
              : paymentMethod === 'google_pay'
              ? 'Google Pay'
              : 'Card'
          }! Your ${planDetail?.name || 'Plus'} plan will renew at ${
            planDetail?.priceZAR || 'R349 / year'
          } in ZAR after 7 days. Cancel anytime.`,
        };
      }

      case 'declined': {
        return {
          success: false,
          scenario: 'declined',
          error:
            'Payment Declined: Your card or wallet was declined by the issuer (Insufficient funds or authentication failure). Please try another payment method.',
        };
      }

      case 'cancelled': {
        return {
          success: false,
          scenario: 'cancelled',
          error:
            'Payment Cancelled: You cancelled the payment sheet. No charge or trial was initiated.',
        };
      }

      case 'failed': {
        return {
          success: false,
          scenario: 'failed',
          error:
            'Payment Failed: Unable to connect to the store payment service. Please check your network connection and retry.',
        };
      }
    }
  },

  /**
   * Restore purchases:
   * Queries store / sandbox record to restore previous entitlements.
   */
  async restorePurchases(): Promise<{ restored: boolean; record: SubscriptionRecord }> {
    await new Promise((r) => setTimeout(r, 700));
    const current = await this.loadSubscription();
    if (this.isPlusActive()) {
      return { restored: true, record: current };
    }

    return { restored: false, record: DEFAULT_FREE_RECORD };
  },

  /**
   * Reset subscription back to Free and reset 7-day free mode timer for testing
   */
  async resetToFree(): Promise<void> {
    cachedFreeStartTime = Date.now();
    await AsyncStorage.setItem(FREE_MODE_START_KEY, cachedFreeStartTime.toString());
    await this.saveRecord(DEFAULT_FREE_RECORD);
  },

  /**
   * Subscribe to entitlement updates across components
   */
  subscribe(listener: (record: SubscriptionRecord) => void): () => void {
    entitlementListeners.add(listener);
    if (cachedRecord) {
      listener(cachedRecord);
    }
    return () => {
      entitlementListeners.delete(listener);
    };
  },

  notifyListeners(record: SubscriptionRecord) {
    entitlementListeners.forEach((fn) => {
      try {
        fn(record);
      } catch (e) {
        console.warn('Listener error:', e);
      }
    });
  },
};
