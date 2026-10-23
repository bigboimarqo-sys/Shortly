import { Check, Xmark } from 'iconoir-react-native';
import React, { useState } from 'react';
import {
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

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleStartTrial = () => {
    Alert.alert(
      'Trial Activated!',
      `You have started your 7-day free trial on the ${
        selectedPlan === 'annual' ? 'Annual (R349/yr)' : 'Monthly (R39/mo)'
      } plan. All Plus features are now unlocked!`,
      [{ text: 'Awesome', onPress: onClose }]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Close */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
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

            {/* Plan Selectors matching Paywall.png */}
            <View style={styles.plansContainer}>
              {/* Annual Plan */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Annual plan R349 per year best value"
                onPress={() => setSelectedPlan('annual')}
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && styles.planCardSelected,
                ]}>
                <View style={styles.planCardHeader}>
                  <Text style={styles.planName}>Annual</Text>
                  <Text style={styles.bestValueBadge}>Best value</Text>
                </View>
                <Text style={styles.planPrice}>R349 / year</Text>
              </Pressable>

              {/* Monthly Plan */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Monthly plan R39 per month"
                onPress={() => setSelectedPlan('monthly')}
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}>
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>R39 / month</Text>
              </Pressable>
            </View>

            {/* Start 7-day free trial button matching Paywall.png */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start 7-day free trial"
              onPress={handleStartTrial}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}>
              <Text style={styles.primaryButtonText}>Start 7-day free trial</Text>
            </Pressable>

            {/* Footer links matching Paywall.png */}
            <Text style={styles.footerLinks}>
              Restore purchases · Terms · Privacy
            </Text>
          </View>
        </ScrollView>
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    marginBottom: 32,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  featuresList: {
    marginBottom: 32,
  },
  featureRow: {
    paddingVertical: 18,
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
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
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
    marginBottom: 6,
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
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  footerLinks: {
    fontSize: 14,
    color: BrandColors.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
});
