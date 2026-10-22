import { useRouter } from 'expo-router';
import React from 'react';

import { SignInView } from '@/components/sign-in-view';

export default function SignInScreen() {
  const router = useRouter();

  return (
    <SignInView
      onSignUpPress={() => router.replace('/sign-up' as any)}
      onContinueWithoutAccount={() => router.replace('/' as any)}
      onSuccess={() => router.replace('/' as any)}
      onBack={() => router.back()}
    />
  );
}
