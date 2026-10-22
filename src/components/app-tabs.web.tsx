import {
  Tabs,
  TabSlot,
} from 'expo-router/ui';
import React from 'react';

/**
 * On web, AppTabs renders the active route cleanly without floating headers.
 */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%', width: '100%' }} />
    </Tabs>
  );
}
