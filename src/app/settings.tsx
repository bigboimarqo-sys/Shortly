import { useRouter } from 'expo-router';
import React from 'react';

import { TabName } from '@/components/bottom-tab-bar';
import { SettingsView } from '@/components/settings-view';

export default function SettingsScreen() {
  const router = useRouter();

  const handleTabChange = (tab: TabName) => {
    switch (tab) {
      case 'Home':
        router.replace('/' as any);
        break;
      case 'Library':
        router.replace('/library' as any);
        break;
      case 'Collections':
        router.replace('/collections' as any);
        break;
      case 'Settings':
        break;
    }
  };

  return (
    <SettingsView
      onTabChange={handleTabChange}
      onNavigateToPermissions={() => router.push('/permissions' as any)}
      onSignOutComplete={() => router.replace('/' as any)}
    />
  );
}
