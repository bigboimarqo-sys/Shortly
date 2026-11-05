/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  try {
    const appTheme = useAppTheme();
    if (appTheme && appTheme.colors) {
      return appTheme.colors;
    }
  } catch (e) {
    // Fall back to system scheme if rendered outside provider
  }

  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  return Colors[theme];
}
