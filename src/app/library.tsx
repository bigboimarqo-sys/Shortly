import { useRouter } from 'expo-router';
import React from 'react';

import { TabName } from '@/components/bottom-tab-bar';
import { LibraryView } from '@/components/library-view';

export default function LibraryScreen() {
  const router = useRouter();

  const handleTabChange = (tab: TabName) => {
    switch (tab) {
      case 'Home':
        router.replace('/' as any);
        break;
      case 'Library':
        break;
      case 'Collections':
        router.replace('/collections' as any);
        break;
      case 'Settings':
        router.replace('/settings' as any);
        break;
    }
  };

  return <LibraryView onTabChange={handleTabChange} />;
}
