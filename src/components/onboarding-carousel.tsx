import { Image } from 'expo-image';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

interface OnboardingCarouselProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function OnboardingCarousel({ onGetStarted, onSignIn }: OnboardingCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < 3) {
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}>
        {/* SLIDE 1: SPLASH (Matches 1 Splash.png) */}
        <SafeAreaView style={[styles.slide, styles.splashSlide]}>
          <View style={styles.splashContent}>
            {/* White card with brand blue scanner icon */}
            <View style={styles.splashIconCard}>
              <Image
                source={require('@/assets/brand/icon-inverted.png')}
                style={styles.splashIconImage}
                contentFit="contain"
              />
            </View>

            <Text style={styles.splashTitle}>Shotly</Text>
            <Text style={styles.splashTagline}>Find any screenshot in seconds.</Text>
          </View>

          {/* Bottom Pagination Dots */}
          <View style={styles.splashBottomArea}>
            <View style={styles.dotsRow}>
              <View style={[styles.dot, activeIndex === 0 ? styles.dotActive : styles.dotInactive]} />
              <View style={[styles.dot, activeIndex === 1 ? styles.dotActive : styles.dotInactive]} />
              <View style={[styles.dot, activeIndex === 2 ? styles.dotActive : styles.dotInactive]} />
            </View>

            <Pressable
              onPress={() => scrollToSlide(1)}
              style={({ pressed }) => [styles.splashNextButton, pressed && { opacity: 0.8 }]}>
              <Text style={styles.splashNextText}>Swipe or tap to explore &rarr;</Text>
            </Pressable>
          </View>
        </SafeAreaView>

        {/* SLIDE 2: ONBOARDING HERO (Matches 2 Onboarding.png) */}
        <SafeAreaView style={[styles.slide, styles.onboardingSlide]}>
          <View style={styles.onboardingTop}>
            {/* White card with brand blue scanner icon */}
            <View style={styles.onboardingIconCard}>
              <Image
                source={require('@/assets/brand/icon-inverted.png')}
                style={styles.onboardingIconImage}
                contentFit="contain"
              />
            </View>

            <Text style={styles.onboardingHeadline}>
              Find any{'\n'}screenshot in{'\n'}seconds
            </Text>

            <Text style={styles.onboardingDescription}>
              Shotly reads the text inside your screenshots and keeps them organised for you.
            </Text>
          </View>

          {/* Action bottom section */}
          <View style={styles.onboardingBottomArea}>
            <View style={styles.dotsRowLeft}>
              <View style={[styles.dot, activeIndex === 0 ? styles.dotActive : styles.dotInactive]} />
              <View style={[styles.dot, activeIndex === 1 ? styles.dotActive : styles.dotInactive]} />
              <View style={[styles.dot, activeIndex === 2 ? styles.dotActive : styles.dotInactive]} />
            </View>

            <Pressable
              onPress={onGetStarted}
              style={({ pressed }) => [
                styles.getStartedButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get started">
              <Text style={styles.getStartedButtonText}>Get started</Text>
            </Pressable>

            <Text style={styles.privacyNotice}>
              Private by default. Processing happens on your phone.
            </Text>
          </View>
        </SafeAreaView>

        {/* SLIDE 3: PRIVACY & OFFLINE (Matches core app value) */}
        <SafeAreaView style={[styles.slide, styles.onboardingSlide]}>
          <View style={styles.onboardingTop}>
            <View style={styles.onboardingIconCard}>
              <Image
                source={require('@/assets/brand/icon-inverted.png')}
                style={styles.onboardingIconImage}
                contentFit="contain"
              />
            </View>

            <Text style={styles.onboardingHeadline}>
              100% On-Device{'\n'}Private &amp;{'\n'}Instant
            </Text>

            <Text style={styles.onboardingDescription}>
              Your screenshots never leave your phone. All OCR and categorization happen offline without uploading to any cloud server.
            </Text>
          </View>

          <View style={styles.onboardingBottomArea}>
            <View style={styles.dotsRowLeft}>
              <View style={[styles.dot, activeIndex === 0 ? styles.dotActive : styles.dotInactive]} />
              <View style={[styles.dot, activeIndex === 1 ? styles.dotActive : styles.dotInactive]} />
              <View style={[styles.dot, activeIndex === 2 ? styles.dotActive : styles.dotInactive]} />
            </View>

            <Pressable
              onPress={onGetStarted}
              style={({ pressed }) => [
                styles.getStartedButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Get started">
              <Text style={styles.getStartedButtonText}>Get started</Text>
            </Pressable>

            {onSignIn && (
              <Pressable
                onPress={onSignIn}
                style={({ pressed }) => [styles.signInLink, pressed && { opacity: 0.7 }]}>
                <Text style={styles.signInLinkText}>
                  Already have an account? <Text style={styles.signInLinkHighlight}>Sign in</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: BrandColors.primary,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 24,
  },
  // Slide 1 Splash Styles
  splashSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splashIconCard: {
    width: 104,
    height: 104,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 8,
  },
  splashIconImage: {
    width: 72,
    height: 72,
  },
  splashTitle: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  splashTagline: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.95,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  splashBottomArea: {
    alignItems: 'center',
    paddingBottom: 36,
    gap: 16,
  },
  splashNextButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  splashNextText: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.85,
    fontWeight: '500',
  },
  // Slide 2 Onboarding Styles
  onboardingSlide: {
    justifyContent: 'space-between',
  },
  onboardingTop: {
    paddingTop: 32,
    alignItems: 'flex-start',
  },
  onboardingIconCard: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
    marginBottom: 36,
  },
  onboardingIconImage: {
    width: 60,
    height: 60,
  },
  onboardingHeadline: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 20,
  },
  onboardingDescription: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 26,
    opacity: 0.95,
    letterSpacing: -0.2,
    maxWidth: 320,
  },
  onboardingBottomArea: {
    paddingBottom: 28,
    gap: 16,
    width: '100%',
  },
  getStartedButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  getStartedButtonText: {
    color: BrandColors.primary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  privacyNotice: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
    letterSpacing: -0.2,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signInLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  signInLinkHighlight: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dotsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
