import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { BrandColors, MaxContentWidth } from '@/constants/theme';

interface CollectionsViewProps {
  onTabChange?: (tab: TabName) => void;
  onNewCollection?: () => void;
}

export function CollectionsView({ onTabChange, onNewCollection }: CollectionsViewProps) {
  const collections = [
    { id: '1', name: 'Receipts', count: 18 },
    { id: '2', name: 'Recipes', count: 7 },
    { id: '3', name: 'Work', count: 24 },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        <View style={styles.mainContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Collections</Text>
          </View>

          {/* Collections List */}
          <View style={styles.listContainer}>
            {collections.map((item) => (
              <View key={item.id} style={styles.collectionRow}>
                <Text style={styles.collectionName}>{item.name}</Text>
                <Text style={styles.collectionCount}>[{item.count}] items</Text>
              </View>
            ))}
          </View>

          {/* Free Plan Limit Notice */}
          <Text style={styles.planNotice}>Free plan: up to 3 Collections</Text>

          {/* New Collection Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New Collection"
            onPress={onNewCollection}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.primaryButtonText}>New Collection</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Persistent Bottom Tab Bar */}
      <BottomTabBar
        activeTab="Collections"
        onTabPress={(tab) => onTabChange && onTabChange(tab)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 110,
  },
  mainContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.6,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  listContainer: {
    marginBottom: 20,
  },
  collectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  collectionName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  collectionCount: {
    fontSize: 16,
    lineHeight: 22,
    color: BrandColors.muted,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  planNotice: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.muted,
    marginBottom: 24,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  primaryButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
});
