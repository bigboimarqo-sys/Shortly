import { useRouter } from 'expo-router';
import React from 'react';

import { PermissionsView } from '@/components/permissions-view';

export default function PermissionsScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/' as any);
  };

  return (
    <PermissionsView
      onAllowAccess={handleComplete}
      onSelectPhotosOnly={handleComplete}
      onComplete={handleComplete}
    />
  );
}
