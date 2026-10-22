import { Slot } from 'expo-router';
import React from 'react';

/**
 * On web, AppTabs delegates directly to Slot with zero unwanted floating headers.
 */
export default function AppTabs() {
  return <Slot />;
}
