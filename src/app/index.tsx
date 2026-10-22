import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
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

  // 1. Onboarding Carousel (includes Splash & Onboarding slides)
  if (currentView === 'onboarding') {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.topControlOverlay}>
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => setCurrentView('onboarding')}
              style={[styles.segBtn, styles.segBtnActive]}>
              <Text style={styles.segTextActive}>1 &amp; 2 Onboarding</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('signup')}
              style={styles.segBtn}>
              <Text style={styles.segText}>3 Sign up</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('signin')}
              style={styles.segBtn}>
              <Text style={styles.segText}>4 Sign in</Text>
            </Pressable>
          </View>
        </View>

        <OnboardingCarousel
          onGetStarted={() => setCurrentView('signup')}
          onSignIn={() => setCurrentView('signin')}
        />
      </View>
    );
  }

  // 2. Sign Up Screen (matches 3 Sign up.png)
  if (currentView === 'signup') {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.topControlOverlayPaper}>
          <View style={styles.segmentedControlPaper}>
            <Pressable
              onPress={() => setCurrentView('onboarding')}
              style={styles.segBtn}>
              <Text style={styles.segTextPaper}>Onboarding</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('signup')}
              style={[styles.segBtn, styles.segBtnActivePaper]}>
              <Text style={styles.segTextActivePaper}>Sign up</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('signin')}
              style={styles.segBtn}>
              <Text style={styles.segTextPaper}>Sign in</Text>
            </Pressable>
          </View>
        </View>

        <SignUpView
          onSignInPress={() => setCurrentView('signin')}
          onContinueWithoutAccount={() => setCurrentView('main')}
          onSuccess={() => setCurrentView('main')}
          onBack={() => setCurrentView('onboarding')}
        />
      </View>
    );
  }

  // 3. Sign In Screen (matches 4 Sign in.png)
  if (currentView === 'signin') {
    return (
      <View style={styles.fullScreen}>
        <View style={styles.topControlOverlayPaper}>
          <View style={styles.segmentedControlPaper}>
            <Pressable
              onPress={() => setCurrentView('onboarding')}
              style={styles.segBtn}>
              <Text style={styles.segTextPaper}>Onboarding</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('signup')}
              style={styles.segBtn}>
              <Text style={styles.segTextPaper}>Sign up</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('signin')}
              style={[styles.segBtn, styles.segBtnActivePaper]}>
              <Text style={styles.segTextActivePaper}>Sign in</Text>
            </Pressable>
          </View>
        </View>

        <SignInView
          onSignUpPress={() => setCurrentView('signup')}
          onContinueWithoutAccount={() => setCurrentView('main')}
          onSuccess={() => setCurrentView('main')}
          onBack={() => setCurrentView('onboarding')}
        />
      </View>
    );
  }

  // 4. Main App Overview
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.segmentedControlInApp}>
          <Pressable
            onPress={() => setCurrentView('onboarding')}
            style={styles.segBtn}>
            <Text style={styles.segTextInApp}>&larr; View Onboarding</Text>
          </Pressable>
          <Pressable
            onPress={() => setCurrentView('signup')}
            style={styles.segBtn}>
            <Text style={styles.segTextInApp}>Sign up</Text>
          </Pressable>
          <Pressable
            onPress={() => setCurrentView('signin')}
            style={styles.segBtn}>
            <Text style={styles.segTextInApp}>Sign in</Text>
          </Pressable>
        </View>

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
            title="UI Screens"
            hint={<ThemedText type="code">Splash, Onboarding, Sign in, Sign up</ThemedText>}
          />
          <HintRow
            title="Social Auth"
            hint={<ThemedText type="code">Official Google &amp; Apple Logos</ThemedText>}
          />
          <HintRow
            title="Theme Branding"
            hint={<ThemedText type="code">Paper #F6F4EE &bull; Brand #38679B</ThemedText>}
          />
        </ThemedView>

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
  topControlOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topControlOverlayPaper: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  segmentedControlPaper: {
    flexDirection: 'row',
    backgroundColor: '#EAE7DF',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  segmentedControlInApp: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 24,
    padding: 3,
    marginBottom: 8,
  },
  segBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  segBtnActivePaper: {
    backgroundColor: BrandColors.primary,
  },
  segText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  segTextActive: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  segTextPaper: {
    color: BrandColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  segTextActivePaper: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  segTextInApp: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '600',
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
});
