import { useRouter } from 'expo-router';
import React from 'react';

import { SignUpView } from '@/components/sign-up-view';

export default function SignUpScreen() {
  const router = useRouter();

  return (
    <SignUpView
      onSignInPress={() => router.replace('/sign-in' as any)}
      onContinueWithoutAccount={() => router.replace('/' as any)}
      onSuccess={() => router.replace('/' as any)}
      onBack={() => router.back()}
    />
  );
}
