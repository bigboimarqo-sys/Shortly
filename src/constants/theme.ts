/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#38679B',
  textOnDark: '#7FA6D1',
  ink: '#14181F',
  paper: '#F6F4EE',
  surface: '#FFFFFF',
  darkCard: '#222A35',
  muted: '#5D646C',
  border: '#E0DDD3',
} as const;

export const Colors = {
  light: {
    brand: BrandColors.primary,
    text: BrandColors.ink,
    background: BrandColors.paper,
    backgroundElement: '#EDEAE1',
    backgroundSelected: BrandColors.border,
    textSecondary: BrandColors.muted,
  },
  dark: {
    brand: BrandColors.primary,
    text: BrandColors.paper,
    background: BrandColors.ink,
    backgroundElement: BrandColors.darkCard,
    backgroundSelected: '#2F3845',
    textSecondary: BrandColors.textOnDark,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
