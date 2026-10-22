import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

interface SocialAuthButtonProps {
  provider: 'google' | 'apple';
  onPress?: () => void;
  style?: any;
}

export function SocialAuthButton({ provider, onPress, style }: SocialAuthButtonProps) {
  const isGoogle = provider === 'google';
  const label = isGoogle ? 'Continue with Google' : 'Continue with Apple';
  const iconSource = isGoogle
    ? require('@/assets/icons/google.svg')
    : require('@/assets/icons/apple.svg');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <View style={styles.iconContainer}>
        <Image
          source={iconSource}
          style={styles.icon}
          contentFit="contain"
        />
      </View>
      <Text style={styles.label}>{label}</Text>
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
