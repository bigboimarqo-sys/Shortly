import { Check, Sparks, WarningTriangle, Xmark } from 'iconoir-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { useSubscription } from '@/context/subscription-context';
import {
  AllowedPaymentMethod,
  SandboxPaymentScenario,
} from '@/services/entitlement-service';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const {
    isPlus,
    record,
    remainingTrialDays,
    activateTrial,
    simulateSandboxCheckout,
    restorePurchases,
    resetToFree,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<'plus_annual' | 'plus_monthly'>(
    'plus_annual'
  );
  const [selectedMethod, setSelectedMethod] = useState<AllowedPaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSandboxSheet, setShowSandboxSheet] = useState(false);
  const [showTermsSheet, setShowTermsSheet] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);

  // 1. Primary Trial Flow on Card / Wallets
  const handleStartTrial = async () => {
    setIsProcessing(true);
    try {
      const res = await simulateSandboxCheckout('success', selectedPlan, selectedMethod);
      if (res.success) {
        Alert.alert(
          '7-Day Free Trial Started!',
          `You have started your 7-day free trial on the ${
            selectedPlan === 'plus_annual' ? 'Annual (R349/yr)' : 'Monthly (R39/mo)'
          } plan in ZAR via ${
            selectedMethod === 'apple_pay'
              ? 'Apple Pay'
              : selectedMethod === 'google_pay'
              ? 'Google Pay'
              : 'Credit/Debit Card'
          }.\n\nAll Shotly Plus features are now unlocked! You can cancel anytime before the trial ends.`,
          [{ text: 'Awesome', onPress: onClose }]
        );
      } else {
        Alert.alert('Payment Notice', res.error || 'Could not complete checkout.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Payment initiation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Sandbox Scenario Simulator
  const handleTestScenario = async (scenario: SandboxPaymentScenario) => {
    setIsProcessing(true);
    setShowSandboxSheet(false);
    try {
      const res = await simulateSandboxCheckout(
        scenario,
        selectedPlan,
        selectedMethod
      );
      if (res.success) {
        Alert.alert('Sandbox Success', res.message || 'Payment succeeded!', [
          { text: 'Great', onPress: onClose },
        ]);
      } else {
        Alert.alert('Sandbox Test Result', res.error || 'Payment failed.');
      }
    } catch (err: any) {
      Alert.alert('Sandbox Error', err?.message || 'Error executing test scenario.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Restore Purchases
  const handleRestorePurchases = async () => {
    setIsProcessing(true);
    try {
      const res = await restorePurchases();
      if (res.restored) {
        Alert.alert(
          'Purchases Restored',
          `Your Shotly Plus subscription (${
            res.record.plan === 'plus_annual' ? 'Annual R349' : 'Monthly R39'
          } in ZAR) has been verified and restored!`,
          [{ text: 'Done', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'No Active Purchases',
          'No active Shotly Plus subscription was found on this store account. If you believe this is an error, please check your Google Play or App Store account subscriptions.'
        );
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message || 'Unable to restore purchases.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Reset to Free (Sandbox helper)
  const handleResetToFree = async () => {
    await resetToFree();
    Alert.alert('Subscription Reset', 'Account reset to Free tier successfully.');
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Sandbox Pill and Close Button */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open sandbox testing menu"
            onPress={() => setShowSandboxSheet(true)}
            style={({ pressed }) => [
              styles.sandboxPill,
              pressed && { opacity: 0.8 },
            ]}>
            <Sparks color={BrandColors.primary} width={14} height={14} strokeWidth={2.5} />
            <Text style={styles.sandboxPillText}>Sandbox Test</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
            onPress={onClose}
            style={styles.closeBtn}>
            <Xmark color={BrandColors.ink} width={22} height={22} strokeWidth={2.2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            {/* Title matching Paywall.png */}
            <Text style={styles.title}>Unlock Shotly Plus</Text>

            {/* Feature Highlights matching Paywall.png */}
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureText}>Unlimited screenshots</Text>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureText}>Unlimited Collections</Text>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureText}>Duplicate cleaner</Text>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureText}>Private Vault and widgets</Text>
              </View>
            </View>

            {/* Plan Selectors matching Paywall.png (Exact ZAR Store Prices) */}
            <View style={styles.plansContainer}>
              {/* Annual Plan: R349 / year in ZAR */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Annual plan R349 per year best value"
                onPress={() => setSelectedPlan('plus_annual')}
                style={[
                  styles.planCard,
                  selectedPlan === 'plus_annual' && styles.planCardSelected,
                ]}>
                <View style={styles.planCardHeader}>
                  <Text style={styles.planName}>Annual</Text>
                  <Text style={styles.bestValueBadge}>Best value</Text>
                </View>
                <Text style={styles.planPrice}>R349 / year</Text>
                <Text style={styles.planSubPrice}>
                  7 days free, then R349/year (R29.08/mo · Save 25%)
                </Text>
              </Pressable>

              {/* Monthly Plan: R39 / month in ZAR */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Monthly plan R39 per month"
                onPress={() => setSelectedPlan('plus_monthly')}
                style={[
                  styles.planCard,
                  selectedPlan === 'plus_monthly' && styles.planCardSelected,
                ]}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>R39 / month</Text>
                <Text style={styles.planSubPrice}>
                  7 days free, then R39/month. Cancel anytime.
                </Text>
              </Pressable>
            </View>

            {/* Payment Method Selector (Card & Wallets only; NO Instant EFT) */}
            <View style={styles.methodsSection}>
              <Text style={styles.methodsTitle}>Payment Method (7-Day Trial)</Text>
              <View style={styles.methodsRow}>
                <Pressable
                  onPress={() => setSelectedMethod('card')}
                  style={[
                    styles.methodChip,
                    selectedMethod === 'card' && styles.methodChipSelected,
                  ]}>
                  <Text
                    style={[
                      styles.methodChipText,
                      selectedMethod === 'card' && styles.methodChipTextSelected,
                    ]}>
                    💳 Card (Visa/Mastercard)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    setSelectedMethod(
                      Platform.OS === 'ios' ? 'apple_pay' : 'google_pay'
                    )
                  }
                  style={[
                    styles.methodChip,
                    (selectedMethod === 'apple_pay' ||
                      selectedMethod === 'google_pay') &&
                      styles.methodChipSelected,
                  ]}>
                  <Text
                    style={[
                      styles.methodChipText,
                      (selectedMethod === 'apple_pay' ||
                        selectedMethod === 'google_pay') &&
                        styles.methodChipTextSelected,
                    ]}>
                    {Platform.OS === 'ios' ? ' Apple Pay' : '📱 Google Pay'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.methodsNote}>
                Note: Instant EFT is not supported for recurring free trial subscriptions.
              </Text>
            </View>

            {/* Start 7-day free trial button matching Paywall.png */}
            <Pressable
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel="Start 7-day free trial"
              onPress={handleStartTrial}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}>
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : isPlus ? (
                <Text style={styles.primaryButtonText}>
                  {record.status === 'trialing'
                    ? `Shotly Plus Active (${remainingTrialDays}d trial left)`
                    : 'Shotly Plus Active'}
                </Text>
              ) : (
                <Text style={styles.primaryButtonText}>Start 7-day free trial</Text>
              )}
            </Pressable>

            {/* Hard rule: Always show Restore purchases, Terms and Privacy on the Paywall */}
            <View style={styles.footerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Restore purchases"
                onPress={handleRestorePurchases}
                style={({ pressed }) => pressed && { opacity: 0.6 }}>
                <Text style={styles.footerLinkText}>Restore purchases</Text>
              </Pressable>

              <Text style={styles.footerDot}>·</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View terms of service"
                onPress={() => setShowTermsSheet(true)}
                style={({ pressed }) => pressed && { opacity: 0.6 }}>
                <Text style={styles.footerLinkText}>Terms</Text>
              </Pressable>

              <Text style={styles.footerDot}>·</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View privacy policy"
                onPress={() => setShowPrivacySheet(true)}
                style={({ pressed }) => pressed && { opacity: 0.6 }}>
                <Text style={styles.footerLinkText}>Privacy</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Sandbox Test Drawer */}
        <Modal
          visible={showSandboxSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSandboxSheet(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Sandbox Payment Simulator</Text>
                  <Text style={styles.modalSubtitle}>
                    Test all payment outcomes in sandbox
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowSandboxSheet(false)}
                  style={styles.modalCloseBtn}>
                  <Xmark color={BrandColors.ink} width={20} height={20} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* 1. Success */}
                <Pressable
                  onPress={() => handleTestScenario('success')}
                  style={[styles.scenarioButton, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#047857' }]}>
                    ✅ Simulate Success (7-Day Trial)
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    Card/Wallet authorized with 7-day free trial on {selectedPlan === 'plus_annual' ? 'R349/yr' : 'R39/mo'}.
                  </Text>
                </Pressable>

                {/* 2. Declined */}
                <Pressable
                  onPress={() => handleTestScenario('declined')}
                  style={[styles.scenarioButton, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#B91C1C' }]}>
                    💳 Simulate Declined Payment
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    Bank decline (insufficient funds, authorization failed).
                  </Text>
                </Pressable>

                {/* 3. Cancelled */}
                <Pressable
                  onPress={() => handleTestScenario('cancelled')}
                  style={[styles.scenarioButton, { backgroundColor: '#FFFBEB' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#B45309' }]}>
                    ❌ Simulate Cancelled Payment
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    User manually dismissed or cancelled the payment modal.
                  </Text>
                </Pressable>

                {/* 4. Failed */}
                <Pressable
                  onPress={() => handleTestScenario('failed')}
                  style={[styles.scenarioButton, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#6D28D9' }]}>
                    ⚠️ Simulate Failed Payment
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    Store API network timeout or connection gateway failure.
                  </Text>
                </Pressable>

                {/* 5. Restore Purchases */}
                <Pressable
                  onPress={() => {
                    setShowSandboxSheet(false);
                    handleRestorePurchases();
                  }}
                  style={[styles.scenarioButton, { backgroundColor: '#EBF2FA' }]}>
                  <Text style={[styles.scenarioTitle, { color: BrandColors.primary }]}>
                    🔄 Test Restore Purchases Flow
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    Simulate checking store receipts and restoring active entitlements.
                  </Text>
                </Pressable>

                {/* 6. Reset to Free */}
                <Pressable
                  onPress={() => {
                    setShowSandboxSheet(false);
                    handleResetToFree();
                  }}
                  style={[styles.scenarioButton, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#374151' }]}>
                    🗑️ Reset Subscription to Free
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    Clears active Plus status so you can test paywalls and free tier limits again.
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Terms of Service Modal */}
        <Modal
          visible={showTermsSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTermsSheet(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Terms of Service</Text>
                <Pressable
                  onPress={() => setShowTermsSheet(false)}
                  style={styles.modalCloseBtn}>
                  <Xmark color={BrandColors.ink} width={20} height={20} />
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>7-Day Free Trial:</Text> Your trial starts immediately upon subscribing with a supported Credit/Debit Card, Apple Pay, or Google Pay. Instant EFT is not accepted for subscription trials.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Pricing in ZAR:</Text> After the 7-day trial, your subscription automatically renews at R349.00/year (Annual) or R39.00/month (Monthly) in South African Rand (ZAR) unless cancelled at least 24 hours before the end of the trial period.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Cancellation:</Text> You can cancel anytime directly via your Google Play Subscriptions or Apple ID Subscription settings. You will retain access until the end of your billing cycle.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Payment Security:</Text> Payment processing is handled securely by Google Play and Apple App Store. Shotly never stores or logs your credit card details or CVVs.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          visible={showPrivacySheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPrivacySheet(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
                <Pressable
                  onPress={() => setShowPrivacySheet(false)}
                  style={styles.modalCloseBtn}>
                  <Xmark color={BrandColors.ink} width={20} height={20} />
                </Pressable>
              </View>
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>100% On-Device Privacy:</Text> Shotly operates offline-first. Your screenshots, images, OCR text, and search indexes remain strictly on your device.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>No Content Logging:</Text> No analytics SDK or external server ever receives your screenshot images, text, or filenames.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Payment Information:</Text> We never request, log, or store your payment card details, bank accounts, or CVVs. Shotly stores only your subscription plan, active status, expiry date, and provider transaction reference.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sandboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF2FA',
    borderWidth: 1,
    borderColor: '#C6D9EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sandboxPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  closeBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  contentContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.6,
    marginBottom: 28,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  featuresList: {
    marginBottom: 28,
  },
  featureRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  featureText: {
    fontSize: 17,
    fontWeight: '500',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  plansContainer: {
    gap: 14,
    marginBottom: 22,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: BrandColors.border,
  },
  planCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#FFFFFF',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  bestValueBadge: {
    fontSize: 13,
    color: BrandColors.primary,
    fontWeight: '700',
    backgroundColor: '#EBF2FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.4,
  },
  planSubPrice: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  methodsSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  methodsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 8,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  methodChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.paper,
    alignItems: 'center',
  },
  methodChipSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#EBF2FA',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  methodChipTextSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  methodsNote: {
    fontSize: 11,
    color: BrandColors.muted,
    fontStyle: 'italic',
  },
  primaryButton: {
    height: 56,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 14,
    color: BrandColors.muted,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerDot: {
    fontSize: 14,
    color: BrandColors.muted,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  modalSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 8,
    backgroundColor: BrandColors.paper,
    borderRadius: 16,
  },
  scenarioButton: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  scenarioDesc: {
    fontSize: 12,
    color: BrandColors.muted,
    lineHeight: 16,
  },
  modalBodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.ink,
    marginBottom: 14,
  },
});
