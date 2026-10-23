import { Check, NavArrowRight, Sparks, Xmark } from 'iconoir-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { useSubscription } from '@/context/subscription-context';
import {
  ApplePayLogo,
  CreditCardLogo,
  GooglePayLogo,
  PayFastLogo,
  SamsungPayLogo,
} from '@/components/payment-logos';
import {
  AllowedPaymentMethod,
  FREE_MODE_DAYS,
  FREE_SCREENSHOT_LIMIT,
  SUBSCRIPTION_MODEL,
  SandboxPaymentScenario,
  SubscriptionPlan,
} from '@/services/entitlement-service';

export type PaywallScreen =
  | 'main'
  | 'choose_payment'
  | 'pay_by_card'
  | 'pay_with_wallet'
  | 'pay_with_payfast'
  | 'payment_error'
  | 'success';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

export function PaywallModal({
  visible,
  onClose,
  onNavigateToSettings,
}: PaywallModalProps) {
  const {
    isPlus,
    record,
    remainingTrialDays,
    activateTrial,
    simulateSandboxCheckout,
    restorePurchases,
    resetToFree,
  } = useSubscription();

  // Navigation flow state
  const [currentScreen, setCurrentScreen] = useState<PaywallScreen>('main');
  const [lastAttemptedScreen, setLastAttemptedScreen] =
    useState<PaywallScreen>('pay_by_card');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    'plus_annual'
  );
  const [selectedMethod, setSelectedMethod] = useState<AllowedPaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form states for "Pay by card"
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // Info Sheets
  const [showSandboxSheet, setShowSandboxSheet] = useState(false);
  const [showTermsSheet, setShowTermsSheet] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);

  // Plan metadata derived from SUBSCRIPTION_MODEL matching user screenshot
  const currentPlanDetail = useMemo(() => {
    return (
      SUBSCRIPTION_MODEL.find((p) => p.id === selectedPlan) ||
      SUBSCRIPTION_MODEL[1]
    );
  }, [selectedPlan]);

  const planTitle = `Shotly ${currentPlanDetail.name}`;
  const planPriceText = currentPlanDetail.priceZAR;
  const planBillingClause = `7-day free trial, then ${currentPlanDetail.priceZAR}. Cancel anytime.`;
  const planAmountNumber = currentPlanDetail.priceAmount;

  // Formatted date 7 days from today for success screen
  const renewalDateFormatted = useMemo(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const day = d.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // Reset screen states on modal close
  const handleClose = () => {
    setCurrentScreen('main');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardholderName('');
    onClose();
  };

  // Card input formatters
  const handleCardNumberChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      setExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setExpiry(clean);
    }
  };

  const handleCvvChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    setCvv(clean);
  };

  // 1. Submit Card Trial Payment (Image 1)
  const handleCardSubmit = async () => {
    setLastAttemptedScreen('pay_by_card');
    // If card number ends with 0000, simulate decline for testing
    const digits = cardNumber.replace(/\s/g, '');
    if (digits.endsWith('0000')) {
      setCurrentScreen('payment_error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await simulateSandboxCheckout('success', selectedPlan, 'card');
      if (res.success) {
        setCurrentScreen('success');
      } else {
        setCurrentScreen('payment_error');
      }
    } catch (e) {
      setCurrentScreen('payment_error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Select Payment Method (Image 2)
  const handleSelectPaymentMethod = async (method: string) => {
    if (method === 'card') {
      setSelectedMethod('card');
      setLastAttemptedScreen('pay_by_card');
      setCurrentScreen('pay_by_card');
    } else if (method === 'payfast') {
      setSelectedMethod('card');
      setLastAttemptedScreen('pay_with_payfast');
      setCurrentScreen('pay_with_payfast');
    } else if (
      method === 'wallet' ||
      method === 'google_pay' ||
      method === 'apple_pay' ||
      method === 'samsung_pay'
    ) {
      setSelectedMethod(
        method === 'samsung_pay' ? 'card' : (method as AllowedPaymentMethod)
      );
      setLastAttemptedScreen('pay_with_wallet');
      setCurrentScreen('pay_with_wallet');
    }
  };

  // 3. Submit Wallet Trial Payment (from "Pay with a wallet" modal)
  const handleWalletSubmit = async (
    wallet: 'google_pay' | 'apple_pay' | 'samsung_pay'
  ) => {
    setSelectedMethod(wallet === 'samsung_pay' ? 'card' : wallet);
    setLastAttemptedScreen('pay_with_wallet');
    setIsProcessing(true);
    try {
      const res = await simulateSandboxCheckout(
        'success',
        selectedPlan,
        wallet === 'samsung_pay' ? 'card' : wallet
      );
      if (res.success) {
        setCurrentScreen('success');
      } else {
        setCurrentScreen('payment_error');
      }
    } catch (e) {
      setCurrentScreen('payment_error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. PayFast Submission (Image 4)
  const handlePayFastSubmit = async () => {
    setLastAttemptedScreen('pay_with_payfast');
    setIsProcessing(true);
    try {
      const res = await simulateSandboxCheckout('success', selectedPlan, 'card');
      if (res.success) {
        setCurrentScreen('success');
      } else {
        setCurrentScreen('payment_error');
      }
    } catch (e) {
      setCurrentScreen('payment_error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Restore Purchases
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
          [{ text: 'Awesome', onPress: handleClose }]
        );
      } else {
        Alert.alert(
          'No Active Purchases',
          'No active Shotly Plus subscription was found on this store account.'
        );
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message || 'Unable to restore purchases.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* ========================================================= */}
        {/* SCREEN 5: SUCCESS STATE ("You're on Plus" - Image 5)     */}
        {/* ========================================================= */}
        {currentScreen === 'success' && (
          <View style={styles.fullScreenContainer}>
            <View style={styles.fullScreenContent}>
              {/* Blue Circle with White Checkmark */}
              <View style={styles.successCircle}>
                <Check color="#FFFFFF" width={48} height={48} strokeWidth={3.2} />
              </View>

              {/* Title */}
              <Text style={styles.stateTitle}>You’re on Plus</Text>

              {/* Subtitle */}
              <Text style={styles.stateSubtitle}>
                Your 7-day free trial has started. You’ll be charged R{planAmountNumber} on{' '}
                {renewalDateFormatted}. Cancel anytime in Settings.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.stateButtonContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start organising"
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.primaryButtonText}>Start organising</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Manage subscription"
                onPress={() => {
                  handleClose();
                  if (onNavigateToSettings) {
                    onNavigateToSettings();
                  }
                }}
                style={styles.textButton}>
                <Text style={styles.manageSubscriptionText}>Manage subscription</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* SCREEN 4: ERROR STATE ("Payment didn't go through" - Image 3) */}
        {/* ========================================================= */}
        {currentScreen === 'payment_error' && (
          <View style={styles.fullScreenContainer}>
            <View style={styles.fullScreenContent}>
              {/* Red Circle with Exclamation Mark */}
              <View style={styles.errorCircle}>
                <Text style={styles.errorExclamation}>!</Text>
              </View>

              {/* Title */}
              <Text style={styles.stateTitle}>Payment didn’t go through</Text>

              {/* Subtitle */}
              <Text style={styles.stateSubtitle}>
                The payment was declined or cancelled. You haven’t been charged.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.stateButtonContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try again"
                onPress={() => setCurrentScreen(lastAttemptedScreen || 'pay_by_card')}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.primaryButtonText}>Try again</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose another method"
                onPress={() => setCurrentScreen('choose_payment')}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.secondaryButtonText}>Choose another method</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* BASE SCREEN: "Unlock Shotly Plus" (Paywall.png)           */}
        {/* ========================================================= */}
        {currentScreen !== 'success' && currentScreen !== 'payment_error' && (
          <View style={{ flex: 1 }}>
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
                onPress={handleClose}
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

                {/* Subscription Model Comparison Table matching User Screenshot */}
                <View style={styles.tableCard}>
                  <Text style={styles.tableTitle}>Subscription model</Text>

                  <View style={styles.tableContainer}>
                    {/* Header Row */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Plan</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Price (ZAR)</Text>
                      <Text style={[styles.tableHeaderCell, { flex: 2.6 }]}>Includes</Text>
                    </View>

                    {/* Free */}
                    <View style={styles.tableRow}>
                      <View style={{ flex: 1.1 }}>
                        <Text style={styles.tableCellBold}>Free</Text>
                        <Text style={styles.freeModeTag}>7-day mode</Text>
                      </View>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>R0</Text>
                      <Text style={[styles.tableCell, { flex: 2.6 }]}>
                        Auto-capture, OCR search, 100 screenshots
                      </Text>
                    </View>

                    {/* Plus */}
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCellBold, { flex: 1.1 }]}>Plus</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>
                        R39 / month or{'\n'}R349 / year
                      </Text>
                      <Text style={[styles.tableCell, { flex: 2.6 }]}>
                        Unlimited library, clean-up, Private Vault
                      </Text>
                    </View>

                    {/* Pro */}
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCellBold, { flex: 1.1 }]}>Pro</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>
                        R79 / month or{'\n'}R699 / year
                      </Text>
                      <Text style={[styles.tableCell, { flex: 2.6 }]}>
                        Cloud sync, Receipt Tracker, Smart Actions
                      </Text>
                    </View>

                    {/* Team */}
                    <View style={styles.tableRowLast}>
                      <Text style={[styles.tableCellBold, { flex: 1.1 }]}>Team</Text>
                      <Text style={[styles.tableCell, { flex: 1.8 }]}>
                        R149 / month,{'\n'}5 seats
                      </Text>
                      <Text style={[styles.tableCell, { flex: 2.6 }]}>
                        Pro plus shared collections
                      </Text>
                    </View>
                  </View>

                  {/* Footnote matching screenshot */}
                  <Text style={styles.tableFooterNote}>
                    Prices are hypotheses to validate; 7-day free trial on paid plans.
                  </Text>
                </View>

                {/* Section header: Select a plan to start trial */}
                <Text style={styles.sectionHeading}>Choose your plan</Text>

                {/* Plan Selectors matching Paywall.png (Exact ZAR Store Prices) */}
                <View style={styles.plansContainer}>
                  {/* Plus Annual: R349 / year in ZAR */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Plus Annual plan R349 per year best value"
                    onPress={() => setSelectedPlan('plus_annual')}
                    style={[
                      styles.planCard,
                      selectedPlan === 'plus_annual' && styles.planCardSelected,
                    ]}>
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planName}>Plus Annual</Text>
                      <Text style={styles.bestValueBadge}>Best value (R29/mo)</Text>
                      <View style={styles.trialPillSmall}>
                        <Text style={styles.trialPillSmallText}>7-day trial</Text>
                      </View>
                    </View>
                    <Text style={styles.planPrice}>R349 / year</Text>
                    <Text style={styles.planIncludesSnippet}>
                      Unlimited library, clean-up & Private Vault
                    </Text>
                  </Pressable>

                  {/* Plus Monthly: R39 / month in ZAR */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Plus Monthly plan R39 per month"
                    onPress={() => setSelectedPlan('plus_monthly')}
                    style={[
                      styles.planCard,
                      selectedPlan === 'plus_monthly' && styles.planCardSelected,
                    ]}>
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planName}>Plus Monthly</Text>
                      <View style={styles.trialPillSmall}>
                        <Text style={styles.trialPillSmallText}>7-day trial</Text>
                      </View>
                    </View>
                    <Text style={styles.planPrice}>R39 / month</Text>
                    <Text style={styles.planIncludesSnippet}>
                      Unlimited library, clean-up & Private Vault
                    </Text>
                  </Pressable>

                  {/* Pro Annual: R699 / year in ZAR */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Pro Annual plan R699 per year"
                    onPress={() => setSelectedPlan('pro_annual')}
                    style={[
                      styles.planCard,
                      selectedPlan === 'pro_annual' && styles.planCardSelected,
                    ]}>
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planName}>Pro Annual</Text>
                      <Text style={styles.bestValueBadge}>Save 26% (R58/mo)</Text>
                      <View style={styles.trialPillSmall}>
                        <Text style={styles.trialPillSmallText}>7-day trial</Text>
                      </View>
                    </View>
                    <Text style={styles.planPrice}>R699 / year</Text>
                    <Text style={styles.planIncludesSnippet}>
                      Cloud sync, Receipt Tracker & Smart Actions
                    </Text>
                  </Pressable>

                  {/* Pro Monthly: R79 / month in ZAR */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Pro Monthly plan R79 per month"
                    onPress={() => setSelectedPlan('pro_monthly')}
                    style={[
                      styles.planCard,
                      selectedPlan === 'pro_monthly' && styles.planCardSelected,
                    ]}>
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planName}>Pro Monthly</Text>
                      <View style={styles.trialPillSmall}>
                        <Text style={styles.trialPillSmallText}>7-day trial</Text>
                      </View>
                    </View>
                    <Text style={styles.planPrice}>R79 / month</Text>
                    <Text style={styles.planIncludesSnippet}>
                      Cloud sync, Receipt Tracker & Smart Actions
                    </Text>
                  </Pressable>

                  {/* Team Monthly: R149 / month in ZAR (5 seats) */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Team Monthly plan R149 per month 5 seats"
                    onPress={() => setSelectedPlan('team_monthly')}
                    style={[
                      styles.planCard,
                      selectedPlan === 'team_monthly' && styles.planCardSelected,
                    ]}>
                    <View style={styles.planCardHeader}>
                      <Text style={styles.planName}>Team Monthly</Text>
                      <Text style={styles.bestValueBadge}>5 seats</Text>
                      <View style={styles.trialPillSmall}>
                        <Text style={styles.trialPillSmallText}>7-day trial</Text>
                      </View>
                    </View>
                    <Text style={styles.planPrice}>R149 / month</Text>
                    <Text style={styles.planIncludesSnippet}>
                      Pro features plus shared team collections
                    </Text>
                  </Pressable>
                </View>

                {/* Start 7-day free trial button -> Opens "Choose how to pay" (Image 2) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start 7-day free trial"
                  onPress={() => setCurrentScreen('choose_payment')}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}>
                  <Text style={styles.primaryButtonText}>
                    Start 7-day free trial · {currentPlanDetail.name}
                  </Text>
                </Pressable>

                {/* Hard rule: Always show Restore purchases, Terms and Privacy on Paywall */}
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
          </View>
        )}

        {/* ========================================================= */}
        {/* BOTTOM SHEET 1: "Choose how to pay" (Image 2)             */}
        {/* ========================================================= */}
        <Modal
          visible={currentScreen === 'choose_payment'}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCurrentScreen('main')}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Title */}
              <Text style={styles.sheetTitle}>Choose how to pay</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Plan Summary Card */}
                <View style={styles.planSummaryBox}>
                  <Text style={styles.summaryPlanTitle}>{planTitle}</Text>
                  <Text style={styles.summaryPlanPrice}>{planPriceText}</Text>
                  <Text style={styles.summaryPlanClause}>{planBillingClause}</Text>
                </View>

                {/* Payment Methods List matching Image 2 */}
                <View style={styles.methodsList}>
                  {/* Card */}
                  <Pressable
                    onPress={() => handleSelectPaymentMethod('card')}
                    style={({ pressed }) => [
                      styles.methodRowCard,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View style={styles.methodIconBox}>
                      <CreditCardLogo size={22} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodRowTitle}>Card</Text>
                      <Text style={styles.methodRowSubtitle}>Visa, Mastercard</Text>
                    </View>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} />
                  </Pressable>

                  {/* Google Pay */}
                  <Pressable
                    onPress={() => handleSelectPaymentMethod('google_pay')}
                    style={({ pressed }) => [
                      styles.methodRowCard,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View style={styles.methodIconBox}>
                      <GooglePayLogo size={20} color={BrandColors.ink} variant="color" />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodRowTitle}>Google Pay</Text>
                      <Text style={styles.methodRowSubtitle}>Android phones</Text>
                    </View>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} />
                  </Pressable>

                  {/* Apple Pay */}
                  <Pressable
                    onPress={() => handleSelectPaymentMethod('apple_pay')}
                    style={({ pressed }) => [
                      styles.methodRowCard,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View style={styles.methodIconBox}>
                      <ApplePayLogo size={20} color={BrandColors.ink} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodRowTitle}>Apple Pay</Text>
                      <Text style={styles.methodRowSubtitle}>iPhone</Text>
                    </View>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} />
                  </Pressable>

                  {/* Samsung Pay */}
                  <Pressable
                    onPress={() => handleSelectPaymentMethod('samsung_pay')}
                    style={({ pressed }) => [
                      styles.methodRowCard,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View style={styles.methodIconBox}>
                      <SamsungPayLogo size={15} color={BrandColors.ink} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodRowTitle}>Samsung Pay</Text>
                      <Text style={styles.methodRowSubtitle}>Samsung phones</Text>
                    </View>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} />
                  </Pressable>

                  {/* PayFast */}
                  <Pressable
                    onPress={() => handleSelectPaymentMethod('payfast')}
                    style={({ pressed }) => [
                      styles.methodRowCard,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <View style={styles.methodIconBox}>
                      <PayFastLogo size={22} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodRowTitle}>PayFast</Text>
                      <Text style={styles.methodRowSubtitle}>Secure checkout</Text>
                    </View>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} />
                  </Pressable>
                </View>

                {/* Subtext */}
                <Text style={styles.methodsDisclaimer}>
                  Only methods available on your phone are shown.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* BOTTOM SHEET 2: "Pay by card" (Image 1)                   */}
        {/* ========================================================= */}
        <Modal
          visible={currentScreen === 'pay_by_card'}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCurrentScreen('choose_payment')}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Title */}
              <Text style={styles.sheetTitle}>Pay by card</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Plan Summary Card */}
                <View style={styles.planSummaryBox}>
                  <Text style={styles.summaryPlanTitle}>{planTitle}</Text>
                  <Text style={styles.summaryPlanPrice}>{planPriceText}</Text>
                  <Text style={styles.summaryPlanClause}>{planBillingClause}</Text>
                </View>

                {/* Inputs matching Image 1 */}
                <View style={styles.formSection}>
                  {/* Card number */}
                  <TextInput
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder="Card number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    style={styles.cardInput}
                  />

                  {/* MM / YY and CVV Row */}
                  <View style={styles.inputRow}>
                    <TextInput
                      value={expiry}
                      onChangeText={handleExpiryChange}
                      placeholder="MM / YY"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      style={[styles.cardInput, styles.halfInput]}
                    />
                    <TextInput
                      value={cvv}
                      onChangeText={handleCvvChange}
                      placeholder="CVV"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      secureTextEntry
                      style={[styles.cardInput, styles.halfInput]}
                    />
                  </View>

                  {/* Name on card */}
                  <TextInput
                    value={cardholderName}
                    onChangeText={setCardholderName}
                    placeholder="Name on card"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    style={styles.cardInput}
                  />
                </View>

                {/* Security Assurance matching Image 1 */}
                <Text style={styles.cardSecurityText}>
                  Card details go straight to our payment provider and are never stored in Shotly.
                </Text>

                {/* Button: "Start 7-day free trial" */}
                <Pressable
                  disabled={isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel="Start 7-day free trial"
                  onPress={handleCardSubmit}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}>
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Start 7-day free trial</Text>
                  )}
                </Pressable>

                {/* Footer clause matching Image 1 */}
                <Text style={styles.cardBottomClause}>
                  You won’t be charged today.
                </Text>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ========================================================= */}
        {/* BOTTOM SHEET 3: "Pay with PayFast" (Image 4)              */}
        {/* ========================================================= */}
        <Modal
          visible={currentScreen === 'pay_with_payfast'}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCurrentScreen('choose_payment')}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Title */}
              <Text style={styles.sheetTitle}>Pay with PayFast</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Plan Summary Card */}
                <View style={styles.planSummaryBox}>
                  <Text style={styles.summaryPlanTitle}>{planTitle}</Text>
                  <Text style={styles.summaryPlanPrice}>{planPriceText}</Text>
                  <Text style={styles.summaryPlanClause}>{planBillingClause}</Text>
                </View>

                {/* Text matching Image 4 */}
                <Text style={styles.payfastExplainer}>
                  You’ll go to PayFast’s secure page to finish paying, then come back to Shotly.
                </Text>

                {/* Button: Continue to PayFast */}
                <Pressable
                  disabled={isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to PayFast"
                  onPress={handlePayFastSubmit}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}>
                  {isProcessing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue to PayFast</Text>
                  )}
                </Pressable>

                {/* Button: Back */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to payment choices"
                  onPress={() => setCurrentScreen('choose_payment')}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* BOTTOM SHEET 4: "Pay with a wallet" (User Screenshot)     */}
        {/* ========================================================= */}
        <Modal
          visible={currentScreen === 'pay_with_wallet'}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCurrentScreen('choose_payment')}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              {/* Title */}
              <Text style={styles.sheetTitle}>Pay with a wallet</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Plan Summary Card */}
                <View style={styles.planSummaryBox}>
                  <Text style={styles.summaryPlanTitle}>{planTitle}</Text>
                  <Text style={styles.summaryPlanPrice}>{planPriceText}</Text>
                  <Text style={styles.summaryPlanClause}>{planBillingClause}</Text>
                </View>

                {/* 3 Wallet Dark Buttons matching User Screenshot */}
                <View style={styles.walletButtonsList}>
                  {/* Google Pay */}
                  <Pressable
                    disabled={isProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Pay with Google Pay"
                    onPress={() => handleWalletSubmit('google_pay')}
                    style={({ pressed }) => [
                      styles.walletDarkButton,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    ]}>
                    <GooglePayLogo size={24} color="#FFFFFF" variant="color" />
                  </Pressable>

                  {/* Apple Pay */}
                  <Pressable
                    disabled={isProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Pay with Apple Pay"
                    onPress={() => handleWalletSubmit('apple_pay')}
                    style={({ pressed }) => [
                      styles.walletDarkButton,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    ]}>
                    <ApplePayLogo size={24} color="#FFFFFF" />
                  </Pressable>

                  {/* Samsung Pay */}
                  <Pressable
                    disabled={isProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Pay with Samsung Pay"
                    onPress={() => handleWalletSubmit('samsung_pay')}
                    style={({ pressed }) => [
                      styles.walletDarkButton,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                    ]}>
                    <SamsungPayLogo size={22} color="#FFFFFF" />
                  </Pressable>
                </View>

                {/* Footnote matching User Screenshot */}
                <Text style={styles.walletDisclaimer}>
                  One tap with the wallet on your phone. Use the official button for each wallet in the build.
                </Text>

                {/* Secondary Back Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to payment choices"
                  onPress={() => setCurrentScreen('choose_payment')}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { marginTop: 16 },
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* SANDBOX TESTING DRAWER                                    */}
        {/* ========================================================= */}
        <Modal
          visible={showSandboxSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSandboxSheet(false)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
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
                  onPress={() => {
                    setShowSandboxSheet(false);
                    setCurrentScreen('success');
                    activateTrial(selectedPlan, selectedMethod);
                  }}
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
                  onPress={() => {
                    setShowSandboxSheet(false);
                    setCurrentScreen('payment_error');
                  }}
                  style={[styles.scenarioButton, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#B91C1C' }]}>
                    💳 Simulate Declined Payment
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    Bank decline (insufficient funds, authorization failed). Routes to "Payment didn’t go through".
                  </Text>
                </Pressable>

                {/* 3. Cancelled */}
                <Pressable
                  onPress={() => {
                    setShowSandboxSheet(false);
                    setCurrentScreen('payment_error');
                  }}
                  style={[styles.scenarioButton, { backgroundColor: '#FFFBEB' }]}>
                  <Text style={[styles.scenarioTitle, { color: '#B45309' }]}>
                    ❌ Simulate Cancelled Payment
                  </Text>
                  <Text style={styles.scenarioDesc}>
                    User manually dismissed or cancelled the payment modal.
                  </Text>
                </Pressable>

                {/* 4. Restore Purchases */}
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

                {/* 5. Reset to Free */}
                <Pressable
                  onPress={async () => {
                    setShowSandboxSheet(false);
                    await resetToFree();
                    Alert.alert('Reset', 'Account reset to Free tier.');
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

        {/* ========================================================= */}
        {/* TERMS OF SERVICE MODAL                                    */}
        {/* ========================================================= */}
        <Modal
          visible={showTermsSheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTermsSheet(false)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
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
                  • <Text style={{ fontWeight: '700' }}>7-Day Free Trial:</Text> Your trial starts immediately upon subscribing with a supported Credit/Debit Card, Apple Pay, Google Pay, or Samsung Pay. Instant EFT is not accepted for subscription trials.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Pricing in ZAR:</Text> After the 7-day trial, your subscription automatically renews at R349.00/year (Annual) or R39.00/month (Monthly) in South African Rand (ZAR) unless cancelled at least 24 hours before the end of the trial period.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Cancellation:</Text> You can cancel anytime directly via your Google Play Subscriptions or Apple ID Subscription settings. You will retain access until the end of your billing cycle.
                </Text>
                <Text style={styles.modalBodyText}>
                  • <Text style={{ fontWeight: '700' }}>Payment Security:</Text> Payment processing is handled securely by store and payment provider APIs. Shotly never stores or logs your credit card details or CVVs.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* PRIVACY POLICY MODAL                                      */}
        {/* ========================================================= */}
        <Modal
          visible={showPrivacySheet}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPrivacySheet(false)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetContainer}>
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
  // Subscription Model Table (matches user screenshot)
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 16,
    marginBottom: 24,
  },
  tableTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.ink,
    marginBottom: 14,
    letterSpacing: -0.4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.border,
    overflow: 'hidden',
    backgroundColor: '#FAF9F5',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#EAE7DF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  tableRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  tableCellBold: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  tableCell: {
    fontSize: 12,
    lineHeight: 16,
    color: BrandColors.ink,
  },
  freeModeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primary,
    marginTop: 2,
  },
  tableFooterNote: {
    fontSize: 12,
    lineHeight: 16,
    color: BrandColors.muted,
    fontStyle: 'italic',
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.ink,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  planIncludesSnippet: {
    fontSize: 12,
    color: BrandColors.muted,
    marginTop: 6,
    lineHeight: 16,
  },
  trialPillSmall: {
    backgroundColor: '#E8F1FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  trialPillSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  plansContainer: {
    gap: 14,
    marginBottom: 28,
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
    fontSize: 14,
    color: BrandColors.muted,
    fontWeight: '500',
  },
  planPrice: {
    fontSize: 26,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.4,
  },
  primaryButton: {
    height: 56,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  secondaryButton: {
    height: 56,
    backgroundColor: '#EAE7DF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: BrandColors.ink,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  textButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageSubscriptionText: {
    color: BrandColors.primary,
    fontSize: 16,
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
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 14,
    color: BrandColors.muted,
    fontWeight: '700',
  },
  // Sheet Styles (matching Image 1, 2, 4)
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: BrandColors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5D0C3',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: BrandColors.ink,
    marginBottom: 16,
    letterSpacing: -0.4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  planSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginBottom: 18,
  },
  summaryPlanTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  summaryPlanPrice: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: BrandColors.ink,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  summaryPlanClause: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.muted,
  },
  // Choose how to pay (Image 2)
  methodsList: {
    gap: 10,
    marginBottom: 16,
  },
  methodRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  methodIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  methodIconGPay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  methodInfo: {
    flex: 1,
  },
  methodRowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 2,
  },
  methodRowSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
  },
  methodsDisclaimer: {
    fontSize: 12,
    color: BrandColors.muted,
    textAlign: 'center',
    marginVertical: 10,
  },
  // Pay by card Form (Image 1)
  formSection: {
    marginBottom: 14,
  },
  cardInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: BrandColors.ink,
    marginBottom: 12,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  cardSecurityText: {
    fontSize: 12,
    lineHeight: 17,
    color: BrandColors.muted,
    marginBottom: 18,
  },
  cardBottomClause: {
    fontSize: 13,
    color: BrandColors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  // Pay with PayFast (Image 4)
  payfastExplainer: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.muted,
    marginBottom: 24,
  },
  // Pay with a wallet (User Screenshot)
  walletButtonsList: {
    gap: 12,
    marginBottom: 16,
  },
  walletDarkButton: {
    height: 54,
    backgroundColor: '#14181F',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  walletDarkButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  walletDisclaimer: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.muted,
    marginBottom: 10,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  // Full-screen Error & Success (Image 3 & 5)
  fullScreenContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  fullScreenContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#2F6396',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#2F6396',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  errorCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#BA2525',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#BA2525',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  errorExclamation: {
    fontSize: 46,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  stateTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: BrandColors.ink,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.6,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  stateSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.muted,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 36,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  stateButtonContainer: {
    width: '100%',
  },
  // Modal Common
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
