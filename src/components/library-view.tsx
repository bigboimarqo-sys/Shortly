import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
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
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

interface LibraryViewProps {
  onTabChange?: (tab: TabName) => void;
}

interface PhotoItem {
  id: string;
  uri: string;
}

export function LibraryView({ onTabChange }: LibraryViewProps) {
  const { isGranted } = usePhotoPermissions();
  const [activeFilter, setActiveFilter] = useState('All');
  const [assets, setAssets] = useState<PhotoItem[]>([]);

  const filters = ['All', 'Receipts', 'Chats', 'Tickets', 'Maps'];

  useEffect(() => {
    let isMounted = true;
    const fetchPhotos = async () => {
      if (Platform.OS === 'web' || !isGranted) return;
      try {
        const result = await (MediaLibrary as any).getAssetsAsync({
          first: 18,
          mediaType: 'photo',
        });
        if (isMounted && result?.assets && result.assets.length > 0) {
          setAssets(
            result.assets.map((a: any) => ({
              id: a.id || a.uri,
              uri: a.uri,
            }))
          );
        }
      } catch (e) {
        // Fall back to placeholders
      }
    };
    fetchPhotos();
    return () => {
      isMounted = false;
    };
  }, [isGranted]);

  const items = Array.from({ length: 18 }, (_, i) => i);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        <View style={styles.mainContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Library</Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={({ pressed }) => [
                    styles.filterPill,
                    isSelected ? styles.filterPillActive : styles.filterPillInactive,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text
                    style={[
                      styles.filterText,
                      isSelected ? styles.filterTextActive : styles.filterTextInactive,
                    ]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 3-column Grid matching Library.png */}
          <View style={styles.grid}>
            {items.map((index) => {
              const asset = assets[index];
              return (
                <View key={index} style={styles.gridItem}>
                  {asset ? (
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={styles.gridPlaceholder} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Tab Bar */}
      <BottomTabBar
        activeTab="Library"
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  filterPillActive: {
    backgroundColor: BrandColors.primary,
  },
  filterPillInactive: {
    backgroundColor: '#EAE7DF',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: BrandColors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '30.5%',
    aspectRatio: 0.85,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#DCE3EB',
  },
  gridPlaceholder: {
    flex: 1,
    backgroundColor: '#DCE3EB',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
