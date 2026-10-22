import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/context/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FlowView = 'onboarding' | 'signup' | 'signin' | 'main';

export default function HomeScreen() {
  const { user, userType, isAuthenticated, isLoading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<FlowView>('onboarding');
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // If already authenticated and user hasn't explicitly navigated to a preview, show main app
  const showMainApp = isAuthenticated || currentView === 'main';

  if (isLoading) {
    return (
      <View style={[styles.fullScreen, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  // 1. Onboarding Carousel (Splash & Onboarding slides - matching 1 Splash.png & 2 Onboarding.png)
  if (!showMainApp && currentView === 'onboarding') {
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
  if (!showMainApp && currentView === 'signup') {
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
  if (!showMainApp && currentView === 'signin') {
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

  // 4. Main App Overview
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
            title="Account Status"
            hint={
              <ThemedText type="code">
                {isAuthenticated ? 'Signed In (Supabase)' : 'Guest (No account)'}
              </ThemedText>
            }
          />
          {isAuthenticated && (
            <>
              <HintRow
                title="User Email"
                hint={<ThemedText type="code">{user?.email || 'N/A'}</ThemedText>}
              />
              <HintRow
                title="user_type"
                hint={<ThemedText type="code">{userType || 'user'}</ThemedText>}
              />
            </>
          )}
          <HintRow
            title="Session Storage"
            hint={<ThemedText type="code">AsyncStorage (Synced)</ThemedText>}
          />
        </ThemedView>

        {isAuthenticated ? (
          <Pressable
            onPress={async () => {
              await signOut();
              setCurrentView('onboarding');
            }}
            style={({ pressed }) => [styles.actionButton, styles.signOutButton, pressed && { opacity: 0.8 }]}>
            <ThemedText type="smallBold" style={styles.signOutText}>
              Sign Out
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.guestActionRow}>
            <Pressable
              onPress={() => setCurrentView('signin')}
              style={({ pressed }) => [styles.actionButton, styles.signInButton, pressed && { opacity: 0.8 }]}>
              <ThemedText type="smallBold" style={styles.signInText}>
                Sign In
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setCurrentView('onboarding')}
              style={({ pressed }) => [styles.actionButton, styles.replayButton, pressed && { opacity: 0.8 }]}>
              <ThemedText type="smallBold" style={styles.replayText}>
                View Onboarding
              </ThemedText>
            </Pressable>
          </View>
        )}

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.paper,
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
  guestActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayButton: {
    backgroundColor: '#EDEAE1',
  },
  replayText: {
    color: BrandColors.primary,
  },
  signInButton: {
    backgroundColor: BrandColors.primary,
  },
  signInText: {
    color: '#FFFFFF',
  },
  signOutButton: {
    backgroundColor: '#FDE8E8',
    marginTop: 8,
    width: '100%',
  },
  signOutText: {
    color: '#E02424',
  },
});
