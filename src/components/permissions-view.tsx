import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

interface PermissionsViewProps {
  onAllowAccess?: () => void;
  onSelectPhotosOnly?: () => void;
  onComplete?: () => void;
}

export function PermissionsView({
  onAllowAccess,
  onSelectPhotosOnly,
  onComplete,
}: PermissionsViewProps) {
  const { requestFullAccess, requestLimitedAccess } = usePhotoPermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowFullAccess = async () => {
    setIsRequesting(true);
    try {
      await requestFullAccess();
      if (onAllowAccess) {
        onAllowAccess();
      }
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSelectPhotosOnly = async () => {
    setIsRequesting(true);
    try {
      await requestLimitedAccess();
      if (onSelectPhotosOnly) {
        onSelectPhotosOnly();
      }
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contentContainer}>
        {/* Top Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Let Shotly see your screenshots</Text>
          <Text style={styles.subtitle}>
            Shotly only needs your photos to find and read screenshots.
          </Text>
        </View>

        {/* Feature Highlights List matching 5 Permissions.png */}
        <View style={styles.featuresList}>
          <View style={styles.featureRow}>
            <Text style={styles.featureText}>
              Finds new screenshots automatically
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureText}>
              Reads text on your phone, not our servers
            </Text>
          </View>

          <View style={styles.featureRow}>
            <Text style={styles.featureText}>
              Originals stay in your gallery
            </Text>
          </View>
        </View>

        {/* Spacer to push buttons to the bottom */}
        <View style={styles.spacer} />

        {/* Bottom Action Buttons */}
        <View style={styles.buttonSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Allow access to photos"
            disabled={isRequesting}
            onPress={handleAllowFullAccess}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isRequesting && styles.buttonDisabled,
            ]}>
            {isRequesting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Allow access to photos</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select photos only"
            disabled={isRequesting}
            onPress={handleSelectPhotosOnly}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              isRequesting && styles.buttonDisabled,
            ]}>
            <Text style={styles.secondaryButtonText}>Select photos only</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  contentContainer: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  headerSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.6,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: BrandColors.muted,
    marginTop: 14,
    fontWeight: '400',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  featuresList: {
    marginTop: 8,
  },
  featureRow: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: BrandColors.ink,
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  buttonSection: {
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
  primaryButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButton: {
    height: 54,
    backgroundColor: '#EAE7DF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  secondaryButtonText: {
    color: BrandColors.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
});
