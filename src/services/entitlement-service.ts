import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUBSCRIPTION_STORAGE_KEY = '@shotly_subscription_record';

export type SubscriptionPlan = 'free' | 'plus_annual' | 'plus_monthly';
export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'canceled' | 'expired';
// Explicitly cards and wallets only; NO instant EFT!
export type AllowedPaymentMethod = 'card' | 'apple_pay' | 'google_pay';

export interface SubscriptionRecord {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiry: number; // Unix timestamp ms
  providerReference: string; // e.g., 'rc_sb_annual_98124'
  trialEnd?: number; // Unix timestamp ms (7 days for card/wallet trials)
  paymentMethod?: AllowedPaymentMethod;
  currency: 'ZAR';
  price: number; // 349 or 39 in ZAR
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
 * Prices: R349 / year (Annual) or R39 / month (Monthly) in ZAR.
 * Trial: 7 days on card and wallets.
 * Instant EFT is strictly disallowed.
 */
export const EntitlementService = {
  /**
   * Initialize and load cached subscription state
   */
  async loadSubscription(): Promise<SubscriptionRecord> {
    try {
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
   * Fast check if the user is currently entitled to Shotly Plus features
   */
  isPlusActive(): boolean {
    if (!cachedRecord) return false;
    const isPlanPlus =
      cachedRecord.plan === 'plus_annual' || cachedRecord.plan === 'plus_monthly';
    const isStatusValid =
      cachedRecord.status === 'active' || cachedRecord.status === 'trialing';
    const notExpired = cachedRecord.expiry > Date.now();
    return isPlanPlus && isStatusValid && notExpired;
  },

  /**
   * Current cached subscription record
   */
  getRecord(): SubscriptionRecord {
    return cachedRecord || DEFAULT_FREE_RECORD;
  },

  /**
   * Days remaining in the 7-day free trial
   */
  getRemainingTrialDays(): number {
    if (!cachedRecord || cachedRecord.status !== 'trialing' || !cachedRecord.trialEnd) {
      return 0;
    }
    const diffMs = cachedRecord.trialEnd - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
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
   * Starts a 7-day free trial on Card or Wallets (Google Pay / Apple Pay).
   * Note: Instant EFT is excluded.
   */
  async activateTrial(
    plan: 'plus_annual' | 'plus_monthly',
    paymentMethod: AllowedPaymentMethod = 'card'
  ): Promise<SubscriptionRecord> {
    const trialDays = 7;
    const now = Date.now();
    const trialEnd = now + trialDays * 24 * 60 * 60 * 1000;
    const price = plan === 'plus_annual' ? 349 : 39;
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
    plan: 'plus_annual' | 'plus_monthly',
    paymentMethod: AllowedPaymentMethod = 'card'
  ): Promise<PaymentResult> {
    // Artificial slight delay to simulate real sandbox network call
    await new Promise((r) => setTimeout(r, 600));

    switch (scenario) {
      case 'success': {
        const record = await this.activateTrial(plan, paymentMethod);
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
          }! Your plan will renew at R${record.price}/year in ZAR after 7 days. Cancel anytime.`,
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
   * Queries store / sandbox record to restore previous Plus entitlements.
   */
  async restorePurchases(): Promise<{ restored: boolean; record: SubscriptionRecord }> {
    await new Promise((r) => setTimeout(r, 700));
    const current = await this.loadSubscription();
    if (
      (current.plan === 'plus_annual' || current.plan === 'plus_monthly') &&
      current.expiry > Date.now()
    ) {
      return { restored: true, record: current };
    }

    // Check if there was a previous record or simulate a sandbox restore
    return { restored: false, record: DEFAULT_FREE_RECORD };
  },

  /**
   * Reset subscription back to Free for sandbox testing
   */
  async resetToFree(): Promise<void> {
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
