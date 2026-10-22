import {
  Folder,
  HomeSimple,
  MediaImage,
  Settings,
} from 'iconoir-react-native';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';

export type TabName = 'Home' | 'Library' | 'Collections' | 'Settings';

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabConfig {
  name: TabName;
  label: string;
  IconComponent: React.ComponentType<{
    color?: string;
    width?: number | string;
    height?: number | string;
    strokeWidth?: number;
  }>;
}

const TABS: TabConfig[] = [
  { name: 'Home', label: 'Home', IconComponent: HomeSimple },
  { name: 'Library', label: 'Library', IconComponent: MediaImage },
  { name: 'Collections', label: 'Collections', IconComponent: Folder },
  { name: 'Settings', label: 'Settings', IconComponent: Settings },
];

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 16) },
      ]}>
      {/* Floating Modern Navigation Pill */}
      <View style={styles.pillContainer}>
        {TABS.map(({ name, label, IconComponent }) => {
          const isActive = activeTab === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${label} tab`}
              onPress={() => onTabPress(name)}
              style={({ pressed }) => [
                styles.tabButton,
                isActive && styles.tabButtonActive,
                pressed && styles.tabButtonPressed,
              ]}>
              <IconComponent
                color={isActive ? BrandColors.primary : BrandColors.muted}
                width={24}
                height={24}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    maxWidth: 340,
    height: 64,
    // Modern shadow & elevation
    shadowColor: '#14181F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#EEF3F8', // Soft brand blue tint
  },
  tabButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});
