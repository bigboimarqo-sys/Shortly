import { Image } from 'expo-image';
import {
  Folder,
  MediaImage,
  Plus,
  Search,
  Xmark,
} from 'iconoir-react-native';
import React, { useMemo, useState } from 'react';
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
import {
  ScreenshotCategory,
  ScreenshotItem,
  useScreenshots,
} from '@/hooks/use-screenshots';

interface MainHomeViewProps {
  onTabChange?: (tab: TabName) => void;
  onSearchPress?: (query: string) => void;
  onReviewPress?: () => void;
  onCollectionPress?: (name: string) => void;
}

const CATEGORY_COLORS: Record<ScreenshotCategory, { bg: string; text: string; border: string }> = {
  Receipts: { bg: '#EBF2FA', text: '#38679B', border: '#C7DCF1' },
  Recipes: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  Work: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  Chats: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  Tickets: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  Maps: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  Other: { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' },
};

const SUGGESTED_SEARCHES = [
  'proof of payment',
  'wifi password',
  'flight booking',
  'dinner',
  'metrics',
  'avocado',
];

export function MainHomeView({
  onTabChange,
  onSearchPress,
  onReviewPress,
  onCollectionPress,
}: MainHomeViewProps) {
  const {
    screenshots,
    isLoading,
    pickScreenshotsFromPhone,
    refreshScreenshots,
  } = useScreenshots();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState<string>('All');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);

  const allCategories: ScreenshotCategory[] = [
    'Receipts',
    'Recipes',
    'Work',
    'Chats',
    'Tickets',
    'Maps',
  ];

  const collections = ['All', 'Receipts', 'Recipes', 'Work', 'Tickets', 'Chats', 'Maps'];

  // Search filter across ALL screenshots and ALL categories
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return screenshots.filter((item) => {
      // Category filter inside search
      if (
        searchCategoryFilter !== 'All' &&
        item.category.toLowerCase() !== searchCategoryFilter.toLowerCase()
      ) {
        return false;
      }

      const matchCat = item.category.toLowerCase().includes(q);
      const matchFile = item.filename.toLowerCase().includes(q);
      const matchOcr = item.ocrText.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat || matchFile || matchOcr || matchTags;
    });
  }, [screenshots, searchQuery, searchCategoryFilter]);

  // Collection filtered screenshots for the Home view
  const collectionScreenshots = useMemo(() => {
    if (activeCollection === 'All') {
      return screenshots;
    }
    return screenshots.filter(
      (s) => s.category.toLowerCase() === activeCollection.toLowerCase()
    );
  }, [screenshots, activeCollection]);

  const recentFour = screenshots.slice(0, 4);
  const isSearching = searchQuery.trim().length > 0;

  const handleCollectionSelect = (col: string) => {
    setActiveCollection(col);
    if (onCollectionPress) {
      onCollectionPress(col);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchCategoryFilter('All');
  };

  const handleSuggestionPress = (term: string) => {
    setSearchQuery(term);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              refreshScreenshots();
            }}
            tintColor={BrandColors.primary}
            colors={[BrandColors.primary]}
          />
        }>
        <View style={styles.mainContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.appTitle}>Shotly</Text>
              <Text style={styles.appSubtitle}>
                {screenshots.length} on-device screenshots
              </Text>
            </View>

            {/* Quick action to pick screenshots directly from phone */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Import photos from phone"
              onPress={() => {
                pickScreenshotsFromPhone();
              }}
              style={({ pressed }) => [
                styles.addPhotoButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}>
              <Plus color="#FFFFFF" width={16} height={16} strokeWidth={2.4} />
              <Text style={styles.addPhotoButtonText}>Import Photos</Text>
            </Pressable>
          </View>

          {/* Search Bar - Searches from all screenshot categories & words */}
          <View style={styles.searchBarContainer}>
            <Search color={BrandColors.muted} width={20} height={20} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search words inside screenshots"
              placeholderTextColor={BrandColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="never"
              autoCorrect={false}
            />
            {isSearching && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search query"
                onPress={handleClearSearch}
                style={styles.clearSearchButton}>
                <Xmark color={BrandColors.muted} width={18} height={18} strokeWidth={2.2} />
              </Pressable>
            )}
          </View>

          {/* 1. If Search is Active: Display matching results across all categories */}
          {isSearching ? (
            <View style={styles.searchResultsContainer}>
              {/* Category Filter Pills for search */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.searchCategoryPillsContainer}>
                {['All', ...allCategories].map((cat) => {
                  const isCatSelected = searchCategoryFilter === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setSearchCategoryFilter(cat)}
                      style={[
                        styles.searchCatPill,
                        isCatSelected
                          ? styles.searchCatPillActive
                          : styles.searchCatPillInactive,
                      ]}>
                      <Text
                        style={[
                          styles.searchCatPillText,
                          isCatSelected
                            ? styles.searchCatPillTextActive
                            : styles.searchCatPillTextInactive,
                        ]}>
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.searchHeaderRow}>
                <Text style={styles.searchResultsHeading}>
                  Found {searchResults.length}{' '}
                  {searchResults.length === 1 ? 'screenshot' : 'screenshots'} across all categories
                </Text>
                <Text style={styles.searchQueryBadge}>"{searchQuery.trim()}"</Text>
              </View>

              {searchResults.length === 0 ? (
                <View style={styles.emptySearchCard}>
                  <Text style={styles.emptySearchTitle}>No matching screenshots</Text>
                  <Text style={styles.emptySearchSubtitle}>
                    Try searching by category name like "Receipts", "Recipes", "Work", "Chats", "Tickets", or words inside your screenshots.
                  </Text>
                  {/* Suggested searches matching Search.png */}
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Try searching:</Text>
                    <View style={styles.suggestionsRow}>
                      {SUGGESTED_SEARCHES.map((term) => (
                        <Pressable
                          key={term}
                          onPress={() => handleSuggestionPress(term)}
                          style={styles.suggestionPill}>
                          <Text style={styles.suggestionText}>{term}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.resultsGrid}>
                  {searchResults.map((item) => {
                    const colorScheme =
                      CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedScreenshot(item)}
                        style={({ pressed }) => [
                          styles.resultCard,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                        ]}>
                        <View style={styles.resultImageWrapper}>
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.resultImage}
                            contentFit="cover"
                            transition={150}
                            cachePolicy="memory-disk"
                          />
                          <View
                            style={[
                              styles.categoryBadgeOverlay,
                              { backgroundColor: colorScheme.bg, borderColor: colorScheme.border },
                            ]}>
                            <Text
                              style={[
                                styles.categoryBadgeOverlayText,
                                { color: colorScheme.text },
                              ]}>
                              {item.category}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.resultMeta}>
                          <Text style={styles.resultFilename} numberOfLines={1}>
                            {item.filename}
                          </Text>
                          <Text style={styles.resultOcrSnippet} numberOfLines={2}>
                            {item.ocrText}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            /* 2. Standard Home View matching 6 Home.png */
            <>
              {/* Recent Section (4 screenshot cards) */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <Pressable
                    onPress={() => {
                      pickScreenshotsFromPhone();
                    }}
                    style={({ pressed }) => [styles.pickMoreButton, pressed && { opacity: 0.7 }]}>
                    <Text style={styles.pickMoreButtonText}>+ Add from phone</Text>
                  </Pressable>
                </View>

                <View style={styles.recentRow}>
                  {[0, 1, 2, 3].map((index) => {
                    const item = recentFour[index];
                    const colorScheme = item
                      ? CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other
                      : null;
                    return (
                      <Pressable
                        key={item?.id ?? index}
                        accessibilityRole="button"
                        accessibilityLabel={item ? item.filename : `Recent screenshot slot ${index + 1}`}
                        onPress={() => {
                          if (item) {
                            setSelectedScreenshot(item);
                          } else {
                            pickScreenshotsFromPhone();
                          }
                        }}
                        style={({ pressed }) => [
                          styles.recentThumb,
                          pressed && styles.thumbPressed,
                        ]}>
                        {item ? (
                          <View style={styles.thumbImageContainer}>
                            <Image
                              source={{ uri: item.uri }}
                              style={styles.thumbImage}
                              contentFit="cover"
                              transition={150}
                              cachePolicy="memory-disk"
                            />
                            {colorScheme && (
                              <View
                                style={[
                                  styles.recentThumbBadge,
                                  { backgroundColor: colorScheme.bg },
                                ]}>
                                <Text
                                  style={[
                                    styles.recentThumbBadgeText,
                                    { color: colorScheme.text },
                                  ]}
                                  numberOfLines={1}>
                                  {item.category}
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.thumbPlaceholder}>
                            <Plus color="#9CA3AF" width={22} height={22} strokeWidth={2} />
                            <Text style={styles.thumbPlaceholderText}>Add</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Needs Review Card matching 6 Home.png */}
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
                <View style={styles.reviewCardLeft}>
                  <Text style={styles.reviewTitle}>Needs review</Text>
                  <Text style={styles.reviewSubtitle}>
                    {screenshots.length} screenshots ready to organize
                  </Text>
                </View>
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>{screenshots.length}</Text>
                </View>
              </Pressable>

              {/* Collections Section matching 6 Home.png */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Collections</Text>
                  <Text style={styles.sectionMeta}>{collectionScreenshots.length} items</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.collectionsRow}>
                  {collections.map((col) => {
                    const isSelected = activeCollection === col;
                    const count =
                      col === 'All'
                        ? screenshots.length
                        : screenshots.filter(
                            (s) => s.category.toLowerCase() === col.toLowerCase()
                          ).length;

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
                          {col} ({count})
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={styles.planLimitText}>
                  Free plan: {screenshots.length} of 500 organised on-device
                </Text>
              </View>

              {/* Categorized Screenshots Feed: Always visible photos on Home */}
              <View style={styles.section}>
                <View style={styles.feedHeaderRow}>
                  <Text style={styles.feedHeading}>
                    {activeCollection === 'All'
                      ? 'All Screenshots'
                      : `${activeCollection} Screenshots`}
                  </Text>
                  <Text style={styles.feedCountText}>
                    {collectionScreenshots.length} {collectionScreenshots.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                {collectionScreenshots.length === 0 ? (
                  <View style={styles.emptyFeedCard}>
                    <Text style={styles.emptyFeedTitle}>No screenshots in {activeCollection}</Text>
                    <Pressable
                      onPress={() => {
                        pickScreenshotsFromPhone();
                      }}
                      style={styles.emptyFeedButton}>
                      <Text style={styles.emptyFeedButtonText}>+ Import from phone</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.feedGrid}>
                    {collectionScreenshots.map((item) => {
                      const colorScheme =
                        CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setSelectedScreenshot(item)}
                          style={({ pressed }) => [
                            styles.feedCard,
                            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                          ]}>
                          <View style={styles.feedImageContainer}>
                            <Image
                              source={{ uri: item.uri }}
                              style={styles.feedImage}
                              contentFit="cover"
                              transition={150}
                              cachePolicy="memory-disk"
                            />
                            <View
                              style={[
                                styles.feedCategoryBadge,
                                {
                                  backgroundColor: colorScheme.bg,
                                  borderColor: colorScheme.border,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.feedCategoryBadgeText,
                                  { color: colorScheme.text },
                                ]}>
                                {item.category}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.feedCardBody}>
                            <Text style={styles.feedFilename} numberOfLines={1}>
                              {item.filename}
                            </Text>
                            <Text style={styles.feedOcrSnippet} numberOfLines={2}>
                              {item.ocrText}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}
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
                <View style={styles.modalHeaderTitleCol}>
                  <View
                    style={[
                      styles.categoryBadgeModal,
                      {
                        backgroundColor:
                          (CATEGORY_COLORS[selectedScreenshot.category] || CATEGORY_COLORS.Other).bg,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.categoryBadgeTextModal,
                        {
                          color:
                            (CATEGORY_COLORS[selectedScreenshot.category] || CATEGORY_COLORS.Other).text,
                        },
                      ]}>
                      {selectedScreenshot.category}
                    </Text>
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedScreenshot.filename}
                  </Text>
                </View>
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

              {selectedScreenshot.ocrText ? (
                <View style={styles.modalOcrContainer}>
                  <View style={styles.modalOcrHeader}>
                    <Text style={styles.modalOcrLabel}>Detected Text (On-Device OCR):</Text>
                  </View>
                  <ScrollView style={styles.modalOcrScroll}>
                    <Text style={styles.modalOcrText}>
                      {selectedScreenshot.ocrText}
                    </Text>
                  </ScrollView>
                </View>
              ) : null}
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  mainContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  appTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.6,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  appSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
    height: '100%',
  },
  clearSearchButton: {
    padding: 6,
  },
  searchResultsContainer: {
    marginBottom: 28,
  },
  searchCategoryPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchCatPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchCatPillActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  searchCatPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: BrandColors.border,
  },
  searchCatPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchCatPillTextActive: {
    color: '#FFFFFF',
  },
  searchCatPillTextInactive: {
    color: BrandColors.ink,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchResultsHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.muted,
  },
  searchQueryBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  emptySearchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  emptySearchTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 8,
  },
  emptySearchSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  suggestionsContainer: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.muted,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionText: {
    fontSize: 12,
    color: BrandColors.ink,
    fontWeight: '500',
  },
  resultsGrid: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    height: 100,
  },
  resultImageWrapper: {
    width: 100,
    height: '100%',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadgeOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  categoryBadgeOverlayText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resultMeta: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  resultFilename: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  resultOcrSnippet: {
    fontSize: 12,
    color: BrandColors.muted,
    lineHeight: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.4,
  },
  sectionMeta: {
    fontSize: 13,
    color: BrandColors.muted,
  },
  pickMoreButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pickMoreButtonText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  recentThumb: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    overflow: 'hidden',
  },
  thumbPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  thumbImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  recentThumbBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  recentThumbBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  thumbPlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BrandColors.border,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  reviewCardLeft: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 3,
  },
  reviewSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
  },
  reviewBadge: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  reviewBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  collectionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  collectionPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  collectionPillActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  collectionPillInactive: {
    backgroundColor: '#EBE8DF',
    borderColor: 'transparent',
  },
  pillPressed: {
    opacity: 0.8,
  },
  collectionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  collectionTextActive: {
    color: '#FFFFFF',
  },
  collectionTextInactive: {
    color: BrandColors.ink,
  },
  planLimitText: {
    marginTop: 14,
    fontSize: 13,
    color: BrandColors.muted,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  feedCountText: {
    fontSize: 12,
    color: BrandColors.muted,
    fontWeight: '500',
  },
  feedGrid: {
    gap: 12,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    height: 96,
  },
  feedImageContainer: {
    width: 96,
    height: '100%',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedCategoryBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  feedCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  feedCardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  feedFilename: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  feedOcrSnippet: {
    fontSize: 12,
    color: BrandColors.muted,
    lineHeight: 16,
  },
  emptyFeedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  emptyFeedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.muted,
    marginBottom: 12,
  },
  emptyFeedButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyFeedButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderTitleCol: {
    flex: 1,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadgeModal: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeTextModal: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalOcrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    maxHeight: 120,
  },
  modalOcrHeader: {
    marginBottom: 4,
  },
  modalOcrLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  modalOcrScroll: {
    maxHeight: 70,
  },
  modalOcrText: {
    fontSize: 13,
    color: BrandColors.ink,
    lineHeight: 18,
  },
});
