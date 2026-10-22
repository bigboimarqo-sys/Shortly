import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

interface MainHomeViewProps {
  onTabChange?: (tab: TabName) => void;
  onSearchPress?: (query: string) => void;
  onReviewPress?: () => void;
  onCollectionPress?: (name: string) => void;
}

interface PhotoItem {
  id: string;
  uri: string;
}

export function MainHomeView({
  onTabChange,
  onSearchPress,
  onReviewPress,
  onCollectionPress,
}: MainHomeViewProps) {
  const { isGranted } = usePhotoPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState('All');
  const [recentAssets, setRecentAssets] = useState<PhotoItem[]>([]);
  const [needsReviewCount] = useState(12);
  const [organizedCount] = useState(42);

  const collections = ['All', 'Receipts', 'Recipes', 'Work'];

  useEffect(() => {
    let isMounted = true;
    const fetchRecentPhotos = async () => {
      if (Platform.OS === 'web' || !isGranted) return;
      try {
        const result = await (MediaLibrary as any).getAssetsAsync({
          first: 4,
          mediaType: 'photo',
        });
        if (isMounted && result?.assets && result.assets.length > 0) {
          setRecentAssets(
            result.assets.map((a: any) => ({
              id: a.id || a.uri,
              uri: a.uri,
            }))
          );
        }
      } catch (err) {
        // Silently fall back to placeholder cards
      }
    };

    fetchRecentPhotos();
    return () => {
      isMounted = false;
    };
  }, [isGranted]);

  const handleCollectionSelect = (col: string) => {
    setActiveCollection(col);
    if (onCollectionPress) {
      onCollectionPress(col);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}>
        <View style={styles.mainContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>Shotly</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search words inside screenshots"
              placeholderTextColor={BrandColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => onSearchPress && onSearchPress(searchQuery)}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Recent Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <View style={styles.recentRow}>
              {[0, 1, 2, 3].map((index) => {
                const asset = recentAssets[index];
                return (
                  <Pressable
                    key={index}
                    accessibilityRole="button"
                    accessibilityLabel={`Recent screenshot ${index + 1}`}
                    style={({ pressed }) => [
                      styles.recentThumb,
                      pressed && styles.thumbPressed,
                    ]}>
                    {asset ? (
                      <Image
                        source={{ uri: asset.uri }}
                        style={styles.thumbImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={styles.thumbPlaceholder} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Needs Review Card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Needs review section"
            onPress={onReviewPress}
            style={({ pressed }) => [
              styles.reviewCard,
              pressed && styles.cardPressed,
            ]}>
            <Text style={styles.reviewTitle}>Needs review</Text>
            <Text style={styles.reviewSubtitle}>
              {needsReviewCount} new screenshots to sort
            </Text>
          </Pressable>

          {/* Collections Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <View style={styles.collectionsRow}>
              {collections.map((col) => {
                const isSelected = activeCollection === col;
                return (
                  <Pressable
                    key={col}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Filter by ${col}`}
                    onPress={() => handleCollectionSelect(col)}
                    style={({ pressed }) => [
                      styles.collectionPill,
                      isSelected ? styles.collectionPillActive : styles.collectionPillInactive,
                      pressed && styles.pillPressed,
                    ]}>
                    <Text
                      style={[
                        styles.collectionPillText,
                        isSelected ? styles.collectionTextActive : styles.collectionTextInactive,
                      ]}>
                      {col}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.planLimitText}>
              Free plan: {organizedCount} of 500 organised
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Persistent Bottom Tab Bar */}
      <BottomTabBar
        activeTab="Home"
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
  appTitle: {
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
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    fontSize: 16,
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
    height: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.3,
    marginBottom: 14,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  recentThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#DCE3EB',
  },
  thumbPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  thumbPlaceholder: {
    flex: 1,
    backgroundColor: '#DCE3EB',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#FAF8F4',
  },
  reviewTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  reviewSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.muted,
    marginTop: 4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  collectionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  collectionPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pillPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  collectionPillActive: {
    backgroundColor: BrandColors.primary,
  },
  collectionPillInactive: {
    backgroundColor: '#EAE7DF',
  },
  collectionPillText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  collectionTextActive: {
    color: '#FFFFFF',
  },
  collectionTextInactive: {
    color: BrandColors.ink,
  },
  planLimitText: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.muted,
    marginTop: 4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
});
