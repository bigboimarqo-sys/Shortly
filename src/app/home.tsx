import { useRouter } from 'expo-router';
import React from 'react';

import { TabName } from '@/components/bottom-tab-bar';
import { MainHomeView } from '@/components/main-home-view';

export default function HomeScreen() {
  const router = useRouter();

  const handleTabChange = (tab: TabName) => {
    switch (tab) {
      case 'Home':
        break;
      case 'Library':
        router.push('/library' as any);
        break;
      case 'Collections':
        router.push('/collections' as any);
        break;
      case 'Settings':
        router.push('/settings' as any);
        break;
    }
  };

  return <MainHomeView onTabChange={handleTabChange} />;
}
