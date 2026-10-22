import { useRouter } from 'expo-router';
import React from 'react';

import { SignUpView } from '@/components/sign-up-view';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

export default function SignUpScreen() {
  const router = useRouter();
  const { isGranted } = usePhotoPermissions();

  const handleNext = () => {
    if (!isGranted) {
      router.replace('/permissions' as any);
    } else {
      router.replace('/' as any);
    }
  };

  return (
    <SignUpView
      onSignInPress={() => router.replace('/sign-in' as any)}
      onContinueWithoutAccount={handleNext}
      onSuccess={handleNext}
      onBack={() => router.back()}
    />
  );
}
