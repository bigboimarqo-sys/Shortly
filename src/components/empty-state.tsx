import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  emoji = '📸',
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        {icon ? icon : <Text style={styles.emojiText}>{emoji}</Text>}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}>
          <Text style={styles.primaryButtonText}>{actionLabel}</Text>
        </Pressable>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={secondaryActionLabel}
          onPress={onSecondaryAction}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={styles.secondaryButtonText}>{secondaryActionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginVertical: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emojiText: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.ink,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 160,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
