import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { ScreenshotItem, useScreenshots } from '@/hooks/use-screenshots';

interface MainHomeViewProps {
  onTabChange?: (tab: TabName) => void;
  onSearchPress?: (query: string) => void;
  onReviewPress?: () => void;
  onCollectionPress?: (name: string) => void;
}

export function MainHomeView({
  onTabChange,
  onSearchPress,
  onReviewPress,
  onCollectionPress,
}: MainHomeViewProps) {
  const {
    screenshots,
    isLoading,
    permissionGranted,
    refreshScreenshots,
  } = useScreenshots();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);

  const collections = ['All', 'Receipts', 'Recipes', 'Work'];

  const handleCollectionSelect = (col: string) => {
    setActiveCollection(col);
    if (onCollectionPress) {
      onCollectionPress(col);
    }
  };

  const recentFour = screenshots.slice(0, 4);
  const reviewCount = screenshots.length > 0 ? screenshots.length : 12;
  const organizedCount = screenshots.length > 0 ? screenshots.length : 42;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshScreenshots}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }>
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

          {/* Permission Prompt Banner (if not granted yet) */}
          {!permissionGranted && Platform.OS !== 'web' && (
            <View style={styles.permissionBanner}>
              <View style={styles.permissionBannerTextCol}>
                <Text style={styles.permissionBannerTitle}>Photo Access Needed</Text>
                <Text style={styles.permissionBannerSubtitle}>
                  Allow access so Shotly can find and read your phone's screenshots.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Allow access"
                onPress={() => refreshScreenshots()}
                style={({ pressed }) => [
                  styles.permissionBannerButton,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={styles.permissionBannerButtonText}>Allow Access</Text>
              </Pressable>
            </View>
          )}

          {/* Recent Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent</Text>
              {isLoading && <ActivityIndicator size="small" color={BrandColors.primary} />}
            </View>

            <View style={styles.recentRow}>
              {[0, 1, 2, 3].map((index) => {
                const item = recentFour[index];
                return (
                  <Pressable
                    key={item?.id ?? index}
                    accessibilityRole="button"
                    accessibilityLabel={item ? `Screenshot ${item.filename}` : `Recent screenshot slot ${index + 1}`}
                    onPress={() => {
                      if (item) {
                        setSelectedScreenshot(item);
                      } else if (!permissionGranted) {
                        refreshScreenshots();
                      }
                    }}
                    style={({ pressed }) => [
                      styles.recentThumb,
                      pressed && styles.thumbPressed,
                    ]}>
                    {item ? (
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.thumbImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
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
            onPress={() => {
              if (onReviewPress) {
                onReviewPress();
              } else if (onTabChange) {
                onTabChange('Library');
              }
            }}
            style={({ pressed }) => [
              styles.reviewCard,
              pressed && styles.cardPressed,
            ]}>
            <Text style={styles.reviewTitle}>Needs review</Text>
            <Text style={styles.reviewSubtitle}>
              {reviewCount} new screenshots to sort
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

      {/* Screenshot Full Preview Modal */}
      {selectedScreenshot && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedScreenshot(null)}>
          <View style={styles.modalBackdrop}>
            <SafeAreaView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedScreenshot.filename}
                </Text>
                <Pressable
                  onPress={() => setSelectedScreenshot(null)}
                  style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: selectedScreenshot.uri }}
                  style={styles.modalImage}
                  contentFit="contain"
                />
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}

      {/* Floating Modern Navigation Pill */}
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
    marginBottom: 24,
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
  permissionBanner: {
    backgroundColor: '#EEF3F8',
    borderColor: BrandColors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  permissionBannerTextCol: {
    flex: 1,
  },
  permissionBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.primary,
    marginBottom: 2,
  },
  permissionBannerSubtitle: {
    fontSize: 13,
    color: BrandColors.ink,
    lineHeight: 18,
  },
  permissionBannerButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBannerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.3,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.92)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalImageContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
