import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandColors } from '@/constants/theme';

interface AuthRequiredModalProps {
  visible: boolean;
  actionName?: string | null;
  onClose: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}

export function AuthRequiredModal({
  visible,
  actionName,
  onClose,
  onSignUp,
  onSignIn,
}: AuthRequiredModalProps) {
  const displayAction = actionName || 'use this feature';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔒</Text>
          </View>

          {/* Title and Subtitle */}
          <Text style={styles.title}>Account Required</Text>
          <Text style={styles.subtitle}>
            Please create a free account or sign in to <Text style={styles.actionHighlight}>{displayAction}</Text> and activate your 7-day free trial.
          </Text>

          {/* Feature Highlights */}
          <View style={styles.perksList}>
            <View style={styles.perkRow}>
              <Text style={styles.perkCheck}>✓</Text>
              <Text style={styles.perkText}>7-Day Free Trial included (up to 100 screenshots)</Text>
            </View>
            <View style={styles.perkRow}>
              <Text style={styles.perkCheck}>✓</Text>
              <Text style={styles.perkText}>100% On-device privacy (never uploaded to cloud)</Text>
            </View>
            <View style={styles.perkRow}>
              <Text style={styles.perkCheck}>✓</Text>
              <Text style={styles.perkText}>Smart OCR search &amp; Clean-Up tools unlocked</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create Free Account"
              onPress={() => {
                onClose();
                onSignUp();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.primaryButtonText}>Create Free Account</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign In"
              onPress={() => {
                onClose();
                onSignIn();
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue browsing as guest"
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={styles.cancelButtonText}>Continue browsing as guest</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: BrandColors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0E3F7',
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontFamily: 'Space Grotesk',
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionHighlight: {
    color: BrandColors.primary,
    fontWeight: '600',
  },
  perksList: {
    width: '100%',
    backgroundColor: BrandColors.paper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  perkCheck: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 10,
  },
  perkText: {
    fontSize: 13,
    color: BrandColors.ink,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: BrandColors.paper,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  secondaryButtonText: {
    color: BrandColors.ink,
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: BrandColors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
