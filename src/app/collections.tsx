import { useRouter } from 'expo-router';
import React from 'react';

import { TabName } from '@/components/bottom-tab-bar';
import { CollectionsView } from '@/components/collections-view';

export default function CollectionsScreen() {
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
        break;
      case 'Settings':
        router.replace('/settings' as any);
        break;
    }
  };

  return <CollectionsView onTabChange={handleTabChange} />;
}
