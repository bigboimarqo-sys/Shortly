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

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { PaywallModal } from '@/components/paywall-modal';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { ScreenshotCategory, useScreenshots } from '@/context/screenshots-context';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

interface SettingsViewProps {
  onTabChange?: (tab: TabName) => void;
  onNavigateToPermissions?: () => void;
  onSignOutComplete?: () => void;
}

const CATEGORIES_LIST: { name: ScreenshotCategory; icon: string; desc: string }[] = [
  { name: 'Receipts', icon: '🧾', desc: 'Invoices, slips, restaurant & online payments' },
  { name: 'Recipes', icon: '🍳', desc: 'Ingredients, cooking instructions, food ideas' },
  { name: 'Work', icon: '💼', desc: 'Slack, emails, dashboards, documents & notes' },
  { name: 'Chats', icon: '💬', desc: 'WhatsApp, iMessage, group chats & DMs' },
  { name: 'Tickets', icon: '🎟️', desc: 'Boarding passes, concert & event tickets' },
  { name: 'Maps', icon: '📍', desc: 'Routes, pins, Google Maps & addresses' },
  { name: 'Memes', icon: '🎭', desc: 'Humor, social media memes & funny quotes' },
  { name: 'Fashion', icon: '👗', desc: 'Clothing, shoes, style inspo & wishlist items' },
  { name: 'Finance', icon: '📈', desc: 'Crypto, stock charts, banking statements' },
  { name: 'Travel', icon: '✈️', desc: 'Hotels, Airbnb bookings, itinerary & flights' },
];

export function SettingsView({
  onTabChange,
  onNavigateToPermissions,
  onSignOutComplete,
}: SettingsViewProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const { status, resetPermissions } = usePhotoPermissions();
  const { screenshots } = useScreenshots();

  const [showPaywall, setShowPaywall] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    if (onSignOutComplete) {
      onSignOutComplete();
    }
  };

  const handleResetPermissions = async () => {
    await resetPermissions();
    if (onNavigateToPermissions) {
      onNavigateToPermissions();
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        <View style={styles.mainContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Settings Items matching Settings.png */}
          <View style={styles.listContainer}>
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>Subscription</Text>
              <View style={styles.rowRightBadge}>
                <Text style={styles.rowValue}>Free</Text>
                <Text style={styles.upgradeInline}>Upgrade</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => setAutoCapture(!autoCapture)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>Auto-capture</Text>
              <Text style={styles.rowValue}>{autoCapture ? 'On' : 'Off'}</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowCategoriesModal(true)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>Categories</Text>
              <Text style={styles.rowValue}>10 categories →</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert('Notifications', 'Notification preferences are set to: Screenshot reminders (Weekly).')
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowValue}>Enabled</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert(
                  '100% On-Device Privacy',
                  'Shotly processes all screenshots and OCR text directly on your device. Your photos and text are never sent to external servers.'
                )
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>Privacy & Security</Text>
              <Text style={styles.rowValue}>On-device</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert('Appearance', 'Shotly supports automatic System theme matching light and dark modes.')
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>Appearance</Text>
              <Text style={styles.rowValue}>System</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                Alert.alert(
                  'About Shotly',
                  'Shotly v1.0.0 (Build 42)\nAuto-organises and reads your screenshots on-device.\nMarket: South Africa'
                )
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <Text style={styles.rowLabel}>About Shotly</Text>
              <Text style={styles.rowValue}>v1.0.0</Text>
            </Pressable>
          </View>


          {/* Permission Status & Diagnostic Controls */}
          <View style={styles.diagnosticCard}>
            <Text style={styles.diagnosticTitle}>Photo &amp; Storage Permissions</Text>
            <Text style={styles.diagnosticSubtitle}>
              Current status: <Text style={styles.diagnosticHighlight}>{status}</Text>
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reconfigure permissions"
              onPress={handleResetPermissions}
              style={({ pressed }) => [
                styles.smallButton,
                styles.permissionButton,
                pressed && { opacity: 0.8 },
              ]}>
              <Text style={styles.permissionButtonText}>Re-test Permissions Flow</Text>
            </Pressable>
          </View>

          {/* Account Status / Sign Out */}
          {isAuthenticated ? (
            <View style={styles.accountCard}>
              <Text style={styles.accountTitle}>Account</Text>
              <Text style={styles.accountEmail}>{user?.email}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign Out"
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.smallButton,
                  styles.signOutButton,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.accountCard}>
              <Text style={styles.accountTitle}>Guest Mode</Text>
              <Text style={styles.accountEmail}>Using Shotly without an account</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign In"
                onPress={onSignOutComplete}
                style={({ pressed }) => [
                  styles.smallButton,
                  styles.signInButton,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Persistent Bottom Tab Bar */}
      <BottomTabBar
        activeTab="Settings"
        onTabPress={(tab) => onTabChange && onTabChange(tab)}
      />

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />

      {/* 10 Smart Categories Modal */}
      <Modal
        visible={showCategoriesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoriesModal(false)}>
        <View style={styles.catModalBackdrop}>
          <View style={styles.catModalContent}>
            <View style={styles.catModalHeader}>
              <View>
                <Text style={styles.catModalTitle}>Categories</Text>
                <Text style={styles.catModalSubtitle}>
                  10 automatic on-device categories
                </Text>
              </View>
              <Pressable
                onPress={() => setShowCategoriesModal(false)}
                style={({ pressed }) => [styles.catCloseBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.catCloseBtnText}>Done</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {CATEGORIES_LIST.map((item) => {
                const count = screenshots.filter((s) => s.category === item.name).length;
                return (
                  <View key={item.name} style={styles.catItemRow}>
                    <Text style={styles.catItemIcon}>{item.icon}</Text>
                    <View style={styles.catItemInfo}>
                      <Text style={styles.catItemName}>{item.name}</Text>
                      <Text style={styles.catItemDesc}>{item.desc}</Text>
                    </View>
                    <View style={styles.catItemCountBadge}>
                      <Text style={styles.catItemCountText}>{count}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.catModalFooter}>
              <Text style={styles.catModalFooterText}>
                🔒 All categorization happens on-device. Your screenshots and text never leave your phone.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 110,
  },
  mainContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.6,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  listContainer: {
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  rowRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeInline: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
    backgroundColor: '#EBF2FA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  rowValue: {
    fontSize: 16,
    lineHeight: 22,
    color: BrandColors.muted,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  diagnosticCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  diagnosticTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  diagnosticSubtitle: {
    fontSize: 14,
    color: BrandColors.muted,
    marginBottom: 12,
  },
  diagnosticHighlight: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  accountEmail: {
    fontSize: 14,
    color: BrandColors.muted,
    marginBottom: 12,
  },
  smallButton: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButton: {
    backgroundColor: '#EAE7DF',
  },
  permissionButtonText: {
    color: BrandColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: '#FDE8E8',
  },
  signOutButtonText: {
    color: '#E02424',
    fontSize: 14,
    fontWeight: '700',
  },
  signInButton: {
    backgroundColor: BrandColors.primary,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  catModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.55)',
    justifyContent: 'flex-end',
  },
  catModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  catModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  catModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  catModalSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 2,
  },
  catCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: BrandColors.paper,
    borderRadius: 16,
  },
  catCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  catItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE8',
    gap: 12,
  },
  catItemIcon: {
    fontSize: 22,
  },
  catItemInfo: {
    flex: 1,
  },
  catItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  catItemDesc: {
    fontSize: 12,
    color: BrandColors.muted,
    marginTop: 2,
  },
  catItemCountBadge: {
    backgroundColor: BrandColors.paper,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  catItemCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  catModalFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
  },
  catModalFooterText: {
    fontSize: 12,
    color: BrandColors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
