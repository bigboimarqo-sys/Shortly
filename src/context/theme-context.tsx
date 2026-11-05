import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export type AppearanceMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@shotly_appearance_preference';

export type ThemePalette = typeof Colors.light | typeof Colors.dark;

interface ThemeContextType {
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => Promise<void>;
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  colors: ThemePalette;
}

const ThemeContext = createContext<ThemeContextType>({
  appearance: 'system',
  setAppearance: async () => {},
  colorScheme: 'light',
  isDark: false,
  colors: Colors.light,
});

export function ThemeProviderCustom({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [appearance, setAppearanceState] = useState<AppearanceMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setAppearanceState(saved);
        }
      } catch (e) {
        console.warn('Failed to load theme preference:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSavedTheme();
  }, []);

  const setAppearance = async (mode: AppearanceMode) => {
    setAppearanceState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  };

  const effectiveScheme: 'light' | 'dark' =
    appearance === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : appearance;

  const isDark = effectiveScheme === 'dark';
  const colors = Colors[effectiveScheme];

  return (
    <ThemeContext.Provider
      value={{
        appearance,
        setAppearance,
        colorScheme: effectiveScheme,
        isDark,
        colors,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
