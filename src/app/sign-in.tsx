import { useRouter } from 'expo-router';
import React from 'react';

import { SignInView } from '@/components/sign-in-view';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

export default function SignInScreen() {
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
    <SignInView
      onSignUpPress={() => router.replace('/sign-up' as any)}
      onContinueWithoutAccount={handleNext}
      onSuccess={handleNext}
      onBack={() => router.back()}
    />
  );
}
