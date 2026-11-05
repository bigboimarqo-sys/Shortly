import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface SocialAuthButtonProps {
  provider: 'google' | 'apple';
  onPress?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: any;
}

export function SocialAuthButton({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
  style,
}: SocialAuthButtonProps) {
  const isGoogle = provider === 'google';
  const label = isGoogle ? 'Continue with Google' : 'Continue with Apple';
  const iconSource = isGoogle
    ? require('@/assets/icons/google.svg')
    : require('@/assets/icons/apple.svg');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.iconContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={BrandColors.ink} />
        ) : (
          <Image
            source={iconSource}
            style={styles.icon}
            contentFit="contain"
          />
        )}
      </View>
      <Text style={styles.label}>
        {isLoading ? 'Connecting...' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    backgroundColor: '#EAE7DF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.65,
  },
  iconContainer: {
    marginRight: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
    color: BrandColors.ink,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
