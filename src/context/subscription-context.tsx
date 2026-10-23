import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  AllowedPaymentMethod,
  DEFAULT_FREE_RECORD,
  EntitlementService,
  PaymentResult,
  SandboxPaymentScenario,
  SubscriptionPlan,
  SubscriptionRecord,
} from '@/services/entitlement-service';

interface SubscriptionContextType {
  isPlus: boolean;
  record: SubscriptionRecord;
  remainingTrialDays: number;
  remainingFreeDays: number;
  isFreeModeExpired: boolean;
  freeScreenshotLimit: number;
  isLoading: boolean;
  activateTrial: (
    plan: SubscriptionPlan,
    method?: AllowedPaymentMethod
  ) => Promise<SubscriptionRecord>;
  simulateSandboxCheckout: (
    scenario: SandboxPaymentScenario,
    plan: SubscriptionPlan,
    method?: AllowedPaymentMethod
  ) => Promise<PaymentResult>;
  restorePurchases: () => Promise<{ restored: boolean; record: SubscriptionRecord }>;
  resetToFree: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  checkScreenshotLimit: (count: number) => {
    allowed: boolean;
    limit: number;
    remaining: number;
    isFreeExpired: boolean;
    message?: string;
  };
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPlus: false,
  record: DEFAULT_FREE_RECORD,
  remainingTrialDays: 0,
  remainingFreeDays: 7,
  isFreeModeExpired: false,
  freeScreenshotLimit: 100,
  isLoading: true,
  activateTrial: async () => DEFAULT_FREE_RECORD,
  simulateSandboxCheckout: async () => ({
    success: false,
    scenario: 'cancelled',
  }),
  restorePurchases: async () => ({ restored: false, record: DEFAULT_FREE_RECORD }),
  resetToFree: async () => {},
  refreshSubscription: async () => {},
  checkScreenshotLimit: () => ({
    allowed: true,
    limit: 100,
    remaining: 100,
    isFreeExpired: false,
  }),
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<SubscriptionRecord>(DEFAULT_FREE_RECORD);
  const [isPlus, setIsPlus] = useState(false);
  const [remainingTrialDays, setRemainingTrialDays] = useState(0);
  const [remainingFreeDays, setRemainingFreeDays] = useState(7);
  const [isFreeModeExpired, setIsFreeModeExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncState = useCallback((rec: SubscriptionRecord) => {
    setRecord(rec);
    const plusActive = EntitlementService.isPlusActive();
    setIsPlus(plusActive);

    // Paid trial days (if in 7-day card/wallet trial)
    if (rec.status === 'trialing' && rec.trialEnd) {
      const diffMs = rec.trialEnd - Date.now();
      setRemainingTrialDays(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
    } else {
      setRemainingTrialDays(0);
    }

    // Free mode 7-day limits
    setRemainingFreeDays(EntitlementService.getRemainingFreeDays());
    setIsFreeModeExpired(EntitlementService.isFreeModeExpired());
  }, []);

  const refreshSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await EntitlementService.loadSubscription();
      syncState(loaded);
    } finally {
      setIsLoading(false);
    }
  }, [syncState]);

  useEffect(() => {
    refreshSubscription();
    const unsubscribe = EntitlementService.subscribe((rec) => {
      syncState(rec);
    });
    return unsubscribe;
  }, [refreshSubscription, syncState]);

  const activateTrial = useCallback(
    async (
      plan: SubscriptionPlan,
      method: AllowedPaymentMethod = 'card'
    ) => {
      const newRec = await EntitlementService.activateTrial(plan, method);
      syncState(newRec);
      return newRec;
    },
    [syncState]
  );

  const simulateSandboxCheckout = useCallback(
    async (
      scenario: SandboxPaymentScenario,
      plan: SubscriptionPlan,
      method: AllowedPaymentMethod = 'card'
    ) => {
      const result = await EntitlementService.simulateSandboxCheckout(
        scenario,
        plan,
        method
      );
      if (result.record) {
        syncState(result.record);
      }
      return result;
    },
    [syncState]
  );

  const restorePurchases = useCallback(async () => {
    const res = await EntitlementService.restorePurchases();
    if (res.restored) {
      syncState(res.record);
    }
    return res;
  }, [syncState]);

  const resetToFree = useCallback(async () => {
    await EntitlementService.resetToFree();
    syncState(DEFAULT_FREE_RECORD);
  }, [syncState]);

  const checkScreenshotLimit = useCallback(
    (count: number) => {
      return EntitlementService.checkScreenshotLimit(count);
    },
    []
  );

  return (
    <SubscriptionContext.Provider
      value={{
        isPlus,
        record,
        remainingTrialDays,
        remainingFreeDays,
        isFreeModeExpired,
        freeScreenshotLimit: 100,
        isLoading,
        activateTrial,
        simulateSandboxCheckout,
        restorePurchases,
        resetToFree,
        refreshSubscription,
        checkScreenshotLimit,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
