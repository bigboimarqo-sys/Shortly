import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { BrandLogo } from '@/components/brand-logo';
import { HintRow } from '@/components/hint-row';
import { OnboardingCarousel } from '@/components/onboarding-carousel';
import { SignInView } from '@/components/sign-in-view';
import { SignUpView } from '@/components/sign-up-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FlowView = 'onboarding' | 'signup' | 'signin' | 'main';

export default function HomeScreen() {
  const [currentView, setCurrentView] = useState<FlowView>('onboarding');
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // 1. Onboarding Carousel (Splash & Onboarding slides - matching 1 Splash.png & 2 Onboarding.png)
  if (currentView === 'onboarding') {
    return (
      <View style={styles.fullScreen}>
        <OnboardingCarousel
          onGetStarted={() => setCurrentView('signup')}
          onSignIn={() => setCurrentView('signin')}
        />
      </View>
    );
  }

  // 2. Sign Up Screen (matching 3 Sign up.png)
  if (currentView === 'signup') {
    return (
      <View style={styles.fullScreen}>
        <SignUpView
          onSignInPress={() => setCurrentView('signin')}
          onContinueWithoutAccount={() => setCurrentView('main')}
          onSuccess={() => setCurrentView('main')}
          onBack={() => setCurrentView('onboarding')}
        />
      </View>
    );
  }

  // 3. Sign In Screen (matching 4 Sign in.png)
  if (currentView === 'signin') {
    return (
      <View style={styles.fullScreen}>
        <SignInView
          onSignUpPress={() => setCurrentView('signup')}
          onContinueWithoutAccount={() => setCurrentView('main')}
          onSuccess={() => setCurrentView('main')}
          onBack={() => setCurrentView('onboarding')}
        />
      </View>
    );
  }

  // 4. Main App
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <BrandLogo height={44} style={styles.brandLogo} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            On-device screenshot scanner &amp; search
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          theme: {isDark ? 'dark (watermark dark)' : 'light (watermark)'}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="Screens"
            hint={<ThemedText type="code">Splash, Onboarding, Sign up, Sign in</ThemedText>}
          />
          <HintRow
            title="Social Auth"
            hint={<ThemedText type="code">Official Google &amp; Apple Logos</ThemedText>}
          />
          <HintRow
            title="Password Field"
            hint={<ThemedText type="code">Show/hide eye toggle</ThemedText>}
          />
        </ThemedView>

        <Pressable
          onPress={() => setCurrentView('onboarding')}
          style={({ pressed }) => [styles.replayButton, pressed && { opacity: 0.7 }]}>
          <ThemedText type="smallBold" style={styles.replayText}>
            &larr; Replay Onboarding &amp; Auth Flow
          </ThemedText>
        </Pressable>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  brandLogo: {
    marginTop: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  replayButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#EDEAE1',
    marginTop: 8,
  },
  replayText: {
    color: BrandColors.primary,
  },
});
