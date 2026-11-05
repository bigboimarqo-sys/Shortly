import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import * as Sentry from '@sentry/react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/context/auth-context';
import { ScreenshotsProvider } from '@/context/screenshots-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { ThemeProviderCustom, useAppTheme } from '@/context/theme-context';
import { AnalyticsService } from '@/services/analytics-service';
import { CrashReporting } from '@/services/crash-reporting-service';

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { isDark } = useAppTheme();
  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    CrashReporting.init();
    AnalyticsService.init();
    AnalyticsService.track('app_opened');
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return (
    <ThemeProviderCustom>
      <AuthProvider>
        <SubscriptionProvider>
          <ScreenshotsProvider>
            <RootNavigation />
          </ScreenshotsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProviderCustom>
  );
}

export default Sentry.wrap(RootLayout);

