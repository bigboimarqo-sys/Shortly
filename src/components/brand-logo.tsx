import { Image, ImageStyle } from 'expo-image';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

export type BrandLogoVariant = 'wordmark' | 'icon';

export interface BrandLogoProps {
  /**
   * Forced color mode. Defaults to active system scheme ('light' or 'dark').
   */
  mode?: 'light' | 'dark';
  /**
   * Whether to show the full wordmark (Icon + "Shotly") or the standalone app icon.
   * Defaults to 'wordmark'.
   */
  variant?: BrandLogoVariant;
  /**
   * Desired height in pixels. Aspect ratio is preserved automatically.
   */
  height?: number;
  /**
   * Desired width in pixels.
   */
  width?: number;
  /**
   * Custom style for container or image.
   */
  style?: StyleProp<ImageStyle>;
  /**
   * If true, uses the exact raw uploaded screenshot assets.
   */
  useRaw?: boolean;
}

export function BrandLogo({
  mode,
  variant = 'wordmark',
  height = 48,
  width,
  style,
  useRaw = false,
}: BrandLogoProps) {
  const currentScheme = useColorScheme();
  const activeMode = mode ?? (currentScheme === 'dark' ? 'dark' : 'light');
  const isDark = activeMode === 'dark';

  if (variant === 'icon') {
    const iconDimension = height ?? width ?? 48;
    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('@/assets/brand/icon.png')}
          style={{ width: iconDimension, height: iconDimension }}
          contentFit="contain"
          accessibilityRole="image"
          accessibilityLabel="Shotly icon"
        />
      </View>
    );
  }

  // Wordmark aspect ratio: 460 / 150 ~= 3.07 (or 300 / 128 ~= 2.34 for raw)
  const aspectRatio = useRaw ? 300 / 128 : 460 / 150;
  const computedHeight = height ?? (width ? width / aspectRatio : 48);
  const computedWidth = width ?? computedHeight * aspectRatio;

  const imageSource = useRaw
    ? isDark
      ? require('@/assets/brand/wordmark-dark-raw.png')
      : require('@/assets/brand/wordmark-light-raw.png')
    : isDark
      ? require('@/assets/brand/wordmark-dark.png')
      : require('@/assets/brand/wordmark-light.png');

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={{ width: computedWidth, height: computedHeight }}
        contentFit="contain"
        transition={200}
        accessibilityRole="image"
        accessibilityLabel={`Shotly logo (${isDark ? 'dark mode' : 'light mode'})`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
