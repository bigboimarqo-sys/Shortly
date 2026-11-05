import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

import {
  DEFAULT_FREE_RECORD,
  EntitlementService,
  PaymentResult,
  SUBSCRIPTION_MODEL,
  SubscriptionPlan,
  SubscriptionRecord,
  formatSubscriptionDate,
} from '@/services/entitlement-service';

export interface RevenueCatState {
  isConfigured: boolean;
  offerings: PurchasesOfferings | null;
  currentOffering: PurchasesOffering | null;
  packages: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
}

class RevenueCatServiceClass {
  private isConfigured = false;
  private customerInfoListenerAttached = false;
  private cachedOfferings: PurchasesOfferings | null = null;

  /**
   * Determine if RevenueCat API keys are provided in .env
   */
  public hasValidApiKeys(): boolean {
    const key =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
        : Platform.OS === 'android'
        ? process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY
        : null;

    if (!key) return false;
    // Disallow unedited template placeholders
    if (
      key.includes('your_apple_api_key_here') ||
      key.includes('your_google_api_key_here') ||
      key.trim() === ''
    ) {
      return false;
    }
    return true;
  }

  /**
   * Returns whether RevenueCat SDK is active and configured
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Initialize RevenueCat SDK with the appropriate platform API Key.
   * Safe to call multiple times or on web without throwing.
   */
  public async initialize(userId?: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('[RevenueCat] Purchases SDK skipped on web platform.');
      return false;
    }

    if (!this.hasValidApiKeys()) {
      console.log(
        '[RevenueCat] No production API key configured in .env. Running in sandbox simulation mode.'
      );
      return false;
    }

    const apiKey =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;

    if (!apiKey) return false;

    try {
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        await Purchases.setLogLevel(LOG_LEVEL.INFO);
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId || null,
      });

      this.isConfigured = true;
      console.log('[RevenueCat] SDK successfully configured for', Platform.OS);

      // Attach customer info update listener once
      if (!this.customerInfoListenerAttached) {
        Purchases.addCustomerInfoUpdateListener((info) => {
          this.handleCustomerInfoUpdate(info);
        });
        this.customerInfoListenerAttached = true;
      }

      // Preload initial offerings and customer info
      await Promise.allSettled([
        this.loadOfferings(),
        this.syncCustomerInfo(),
      ]);

      return true;
    } catch (error) {
      console.warn('[RevenueCat] Failed to configure Purchases SDK:', error);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Identify a user in RevenueCat when logged in (e.g. Supabase Auth)
   */
  public async logIn(userId: string): Promise<CustomerInfo | null> {
    if (!this.isConfigured) return null;
    try {
      const result = await Purchases.logIn(userId);
      this.handleCustomerInfoUpdate(result.customerInfo);
      return result.customerInfo;
    } catch (e) {
      console.warn('[RevenueCat] Error during logIn:', e);
      return null;
    }
  }

  /**
   * Log out user from RevenueCat on sign out
   */
  public async logOut(): Promise<void> {
    if (!this.isConfigured) return;
    try {
      const info = await Purchases.logOut();
      this.handleCustomerInfoUpdate(info);
    } catch (e) {
      console.warn('[RevenueCat] Error during logOut:', e);
    }
  }

  /**
   * Load store offerings from RevenueCat
   */
  public async loadOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.isConfigured) return null;
    try {
      const offerings = await Purchases.getOfferings();
      this.cachedOfferings = offerings;
      return offerings;
    } catch (e) {
      console.warn('[RevenueCat] Error fetching offerings:', e);
      return null;
    }
  }

  public getCachedOfferings(): PurchasesOfferings | null {
    return this.cachedOfferings;
  }

  /**
   * Find package matching a Shotly plan identifier
   */
  public findPackageForPlan(planId: SubscriptionPlan): PurchasesPackage | null {
    if (!this.cachedOfferings?.current) return null;
    const currentPackages = this.cachedOfferings.current.availablePackages;

    // First try matching product identifier directly
    const directMatch = currentPackages.find(
      (pkg) => pkg.product.identifier === planId
    );
    if (directMatch) return directMatch;

    // Fallback: match by package type
    if (planId === 'plus_annual' || planId === 'pro_annual') {
      return (
        currentPackages.find((pkg) => pkg.packageType === 'ANNUAL') ||
        currentPackages[0] ||
        null
      );
    }
    if (planId === 'plus_monthly' || planId === 'pro_monthly' || planId === 'team_monthly') {
      return (
        currentPackages.find((pkg) => pkg.packageType === 'MONTHLY') ||
        currentPackages[0] ||
        null
      );
    }

    return currentPackages[0] || null;
  }

  /**
   * Make purchase through RevenueCat for a plan
   */
  public async purchasePlan(planId: SubscriptionPlan): Promise<PaymentResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        scenario: 'failed',
        error:
          'RevenueCat is not configured. Please set your RevenueCat API keys in .env or use Sandbox simulation.',
      };
    }

    try {
      const pkg = this.findPackageForPlan(planId);
      let customerInfo: CustomerInfo;

      if (pkg) {
        const result = await Purchases.purchasePackage(pkg);
        customerInfo = result.customerInfo;
      } else {
        // Fallback directly to product ID purchase
        const result = await Purchases.purchaseProduct(planId);
        customerInfo = result.customerInfo;
      }

      const record = this.mapCustomerInfoToRecord(customerInfo, planId);
      if (record) {
        await EntitlementService.saveRecord(record);
        const planDetail = SUBSCRIPTION_MODEL.find((p) => p.id === record.plan);
        const expiryFormatted = formatSubscriptionDate(record.expiry);
        return {
          success: true,
          scenario: 'success',
          record,
          message: `Subscription active! Plan: ${planDetail?.name || record.plan}. Valid until ${expiryFormatted}.`,
        };
      }

      return {
        success: false,
        scenario: 'failed',
        error: 'Purchase completed, but active entitlement was not found on your account.',
      };
    } catch (error: any) {
      if (error?.userCancelled) {
        return {
          success: false,
          scenario: 'cancelled',
          error: 'Purchase was cancelled by user.',
        };
      }

      console.warn('[RevenueCat] Purchase error:', error);
      return {
        success: false,
        scenario: 'failed',
        error: error?.message || 'Store purchase failed. Please check your payment method and retry.',
      };
    }
  }

  /**
   * Restore purchases via RevenueCat
   */
  public async restorePurchases(): Promise<{ restored: boolean; record: SubscriptionRecord }> {
    if (!this.isConfigured) {
      return { restored: false, record: DEFAULT_FREE_RECORD };
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const record = this.mapCustomerInfoToRecord(customerInfo);

      if (record) {
        await EntitlementService.saveRecord(record);
        return { restored: true, record };
      }

      return { restored: false, record: DEFAULT_FREE_RECORD };
    } catch (e) {
      console.warn('[RevenueCat] Error restoring purchases:', e);
      return { restored: false, record: DEFAULT_FREE_RECORD };
    }
  }

  /**
   * Synchronize customer info with EntitlementService
   */
  public async syncCustomerInfo(): Promise<SubscriptionRecord | null> {
    if (!this.isConfigured) return null;
    try {
      const info = await Purchases.getCustomerInfo();
      return this.handleCustomerInfoUpdate(info);
    } catch (e) {
      console.warn('[RevenueCat] Error syncing customer info:', e);
      return null;
    }
  }

  /**
   * Process customer info updates and update local state
   */
  private handleCustomerInfoUpdate(info: CustomerInfo): SubscriptionRecord | null {
    const record = this.mapCustomerInfoToRecord(info);
    if (record) {
      EntitlementService.saveRecord(record);
      return record;
    }
    return null;
  }

  /**
   * Map RevenueCat CustomerInfo to Shotly SubscriptionRecord
   */
  public mapCustomerInfoToRecord(
    info: CustomerInfo,
    hintPlan?: SubscriptionPlan
  ): SubscriptionRecord | null {
    // Check all active entitlements: 'plus', 'pro', 'team', or any active entitlement
    const activeEntitlements = info.entitlements.active;
    const activeKeys = Object.keys(activeEntitlements);

    if (activeKeys.length === 0) {
      return null;
    }

    // Pick first matching entitlement or the active entitlement
    const entitlement =
      activeEntitlements['plus'] ||
      activeEntitlements['pro'] ||
      activeEntitlements['team'] ||
      activeEntitlements[activeKeys[0]];

    if (!entitlement) return null;

    // Resolve plan
    let plan: SubscriptionPlan = hintPlan || 'plus_annual';
    const prodId = entitlement.productIdentifier.toLowerCase();

    if (prodId.includes('pro_annual')) {
      plan = 'pro_annual';
    } else if (prodId.includes('pro_monthly')) {
      plan = 'pro_monthly';
    } else if (prodId.includes('team')) {
      plan = 'team_monthly';
    } else if (prodId.includes('plus_monthly')) {
      plan = 'plus_monthly';
    } else if (prodId.includes('plus_annual')) {
      plan = 'plus_annual';
    }

    const planDetail = SUBSCRIPTION_MODEL.find((p) => p.id === plan);
    const now = Date.now();

    // Expiry date
    let expiry = now + 365 * 24 * 60 * 60 * 1000;
    if (entitlement.expirationDate) {
      const parsedExp = new Date(entitlement.expirationDate).getTime();
      if (!isNaN(parsedExp)) {
        expiry = parsedExp;
      }
    }

    // Status: trialing if periodType is TRIAL, otherwise active
    const isTrial = entitlement.periodType === 'TRIAL';
    const trialEnd = isTrial ? now + (planDetail?.trialDays ?? 7) * 24 * 60 * 60 * 1000 : undefined;

    const record: SubscriptionRecord = {
      plan,
      status: isTrial ? 'trialing' : 'active',
      expiry,
      trialEnd,
      providerReference: `rc_${entitlement.identifier}_${entitlement.productIdentifier}`,
      paymentMethod: Platform.OS === 'ios' ? 'apple_pay' : 'google_pay',
      currency: 'ZAR',
      price: planDetail?.priceAmount || 349,
      updatedAt: now,
    };

    return record;
  }
}

export const RevenueCatService = new RevenueCatServiceClass();
