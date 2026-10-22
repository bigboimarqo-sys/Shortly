import { useRouter } from 'expo-router';
import React from 'react';

import { OnboardingCarousel } from '@/components/onboarding-carousel';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <OnboardingCarousel
      onGetStarted={() => router.push('/sign-up' as any)}
      onSignIn={() => router.push('/sign-in' as any)}
    />
  );
}
