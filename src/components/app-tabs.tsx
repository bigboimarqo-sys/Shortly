import { Slot } from 'expo-router';
import React from 'react';

/**
 * AppTabs delegates to Expo Router's Slot, ensuring no template headers
 * or navigation bars are injected above or below custom brand views.
 */
export default function AppTabs() {
  return <Slot />;
}
