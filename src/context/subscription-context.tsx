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
  isLoading: boolean;
  activateTrial: (
    plan: 'plus_annual' | 'plus_monthly',
    method?: AllowedPaymentMethod
  ) => Promise<SubscriptionRecord>;
  simulateSandboxCheckout: (
    scenario: SandboxPaymentScenario,
    plan: 'plus_annual' | 'plus_monthly',
    method?: AllowedPaymentMethod
  ) => Promise<PaymentResult>;
  restorePurchases: () => Promise<{ restored: boolean; record: SubscriptionRecord }>;
  resetToFree: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPlus: false,
  record: DEFAULT_FREE_RECORD,
  remainingTrialDays: 0,
  isLoading: true,
  activateTrial: async () => DEFAULT_FREE_RECORD,
  simulateSandboxCheckout: async () => ({
    success: false,
    scenario: 'cancelled',
  }),
  restorePurchases: async () => ({ restored: false, record: DEFAULT_FREE_RECORD }),
  resetToFree: async () => {},
  refreshSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [record, setRecord] = useState<SubscriptionRecord>(DEFAULT_FREE_RECORD);
  const [isPlus, setIsPlus] = useState(false);
  const [remainingTrialDays, setRemainingTrialDays] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const syncState = useCallback((rec: SubscriptionRecord) => {
    setRecord(rec);
    const plusActive =
      (rec.plan === 'plus_annual' || rec.plan === 'plus_monthly') &&
      (rec.status === 'active' || rec.status === 'trialing') &&
      rec.expiry > Date.now();
    setIsPlus(plusActive);

    if (rec.status === 'trialing' && rec.trialEnd) {
      const diffMs = rec.trialEnd - Date.now();
      setRemainingTrialDays(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
    } else {
      setRemainingTrialDays(0);
    }
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
      plan: 'plus_annual' | 'plus_monthly',
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
      plan: 'plus_annual' | 'plus_monthly',
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

  return (
    <SubscriptionContext.Provider
      value={{
        isPlus,
        record,
        remainingTrialDays,
        isLoading,
        activateTrial,
        simulateSandboxCheckout,
        restorePurchases,
        resetToFree,
        refreshSubscription,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
