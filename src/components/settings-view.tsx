import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

interface SettingsViewProps {
  onTabChange?: (tab: TabName) => void;
  onNavigateToPermissions?: () => void;
  onSignOutComplete?: () => void;
}

export function SettingsView({
  onTabChange,
  onNavigateToPermissions,
  onSignOutComplete,
}: SettingsViewProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const { status, resetPermissions } = usePhotoPermissions();

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
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Subscription</Text>
              <Text style={styles.rowValue}>Free</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Auto-capture</Text>
              <Text style={styles.rowValue}>On</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Categories</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Notifications</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Privacy</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Appearance</Text>
              <Text style={styles.rowValue}>System</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>About Shotly</Text>
            </View>
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
});
