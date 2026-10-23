import { Image } from 'expo-image';
import {
  Folder,
  HeadsetHelp,
  MediaImage,
  NavArrowRight,
  Plus,
  Search,
  Sparks,
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

import { AISupportModal } from '@/components/ai-support-modal';
import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { CleanUpModal } from '@/components/clean-up-modal';
import { PaywallModal } from '@/components/paywall-modal';
import { ScreenshotDetailModal } from '@/components/screenshot-detail-modal';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { useSubscription } from '@/context/subscription-context';
import { AIService } from '@/services/ai-service';
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
  Memes: { bg: '#FDF4FF', text: '#A21CAF', border: '#F0ABFC' },
  Fashion: { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  Finance: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  Travel: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
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
    needsReviewCount,
    pickScreenshotsFromPhone,
    refreshScreenshots,
  } = useScreenshots();
  const { isPlus } = useSubscription();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollection, setActiveCollection] = useState<string>('All');
  const [searchCategoryFilter, setSearchCategoryFilter] = useState<string>('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);
  const [showCleanUpModal, setShowCleanUpModal] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showAiSupport, setShowAiSupport] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const allCategories: ScreenshotCategory[] = [
    'Receipts',
    'Recipes',
    'Work',
    'Chats',
    'Tickets',
    'Maps',
    'Memes',
    'Fashion',
    'Finance',
    'Travel',
  ];

  const collections = ['All', 'Receipts', 'Recipes', 'Work', 'Tickets', 'Chats', 'Maps'];

  // AI Semantic Search Insight
  const aiSearchInsight = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return AIService.searchLibraryWithAI(searchQuery, screenshots);
  }, [searchQuery, screenshots]);

  // Search filter across ALL screenshots and ALL categories
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return screenshots.filter((item) => {
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

            <View style={styles.headerRightActions}>
              {/* 24/7 Live AI Customer Support Header Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open 24/7 Live AI Support"
                onPress={() => setShowAiSupport(true)}
                style={({ pressed }) => [
                  styles.aiSupportHeaderBtn,
                  pressed && { opacity: 0.8 },
                ]}>
                <HeadsetHelp color={BrandColors.primary} width={15} height={15} strokeWidth={2.4} />
                <Text style={styles.aiSupportHeaderBtnText}>24/7 AI</Text>
                <View style={styles.onlineDotMini} />
              </Pressable>

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
                <Text style={styles.addPhotoButtonText}>Import</Text>
              </Pressable>
            </View>
          </View>

          {/* Floating Pill Search Bar (Modern Floating Capsule Design) */}
          <View
            style={[
              styles.floatingSearchPill,
              isSearchFocused && styles.floatingSearchPillFocused,
            ]}>
            <Search
              color={isSearchFocused ? BrandColors.primary : BrandColors.muted}
              width={20}
              height={20}
              strokeWidth={2.2}
            />
            <TextInput
              style={styles.floatingSearchInput}
              placeholder="Search words inside screenshots"
              placeholderTextColor={BrandColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
              clearButtonMode="never"
              autoCorrect={false}
            />
            {isSearching ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search query"
                onPress={handleClearSearch}
                style={styles.clearSearchButton}>
                <Xmark color={BrandColors.muted} width={18} height={18} strokeWidth={2.2} />
              </Pressable>
            ) : (
              <View style={styles.searchPillBadge}>
                <Text style={styles.searchPillBadgeText}>ALL</Text>
              </View>
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

              {/* AI Semantic Search Insight Card */}
              {aiSearchInsight && (
                <View style={styles.aiSearchCard}>
                  <View style={styles.aiSearchHeader}>
                    <Sparks color={BrandColors.primary} width={15} height={15} strokeWidth={2.5} />
                    <Text style={styles.aiSearchTitle}>Shotly AI Search</Text>
                  </View>
                  <Text style={styles.aiSearchAnswer}>{aiSearchInsight.bestAnswer}</Text>
                </View>
              )}

              {searchResults.length === 0 ? (
                <View style={styles.emptySearchCard}>
                  <Text style={styles.emptySearchTitle}>No matching screenshots</Text>
                  <Text style={styles.emptySearchSubtitle}>
                    Try searching by category name like "Receipts", "Recipes", "Work", "Chats", "Tickets", or words inside your screenshots.
                  </Text>
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsLabel}>Try searching:</Text>
                    <View style={styles.suggestionsRow}>
                      {SUGGESTED_SEARCHES.map((term) => (
                        <Pressable
                          key={term}
                          onPress={() => setSearchQuery(term)}
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

              {/* Needs Review Card matching 6 Home.png (Now opens CleanUpModal!) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Needs review section"
                onPress={() => setShowCleanUpModal(true)}
                style={({ pressed }) => [
                  styles.reviewCard,
                  pressed && styles.cardPressed,
                ]}>
                <View style={styles.reviewCardLeft}>
                  <View style={styles.reviewTitleRow}>
                    <Text style={styles.reviewTitle}>Needs review</Text>
                    <View style={styles.reviewPulseDot} />
                  </View>
                  <Text style={styles.reviewSubtitle}>
                    {needsReviewCount > 0
                      ? `${needsReviewCount} screenshots to sort`
                      : 'All screenshots organised · Tap for Clean-Up'}
                  </Text>
                </View>
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>
                    {needsReviewCount > 0 ? needsReviewCount : screenshots.length}
                  </Text>
                </View>
              </Pressable>

              {/* Collections Section matching 6 Home.png */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Collections</Text>
                  <Pressable onPress={() => onTabChange && onTabChange('Collections')}>
                    <Text style={styles.sectionMetaLink}>View all →</Text>
                  </Pressable>
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

                {/* Plan limit notice: Tapping opens PaywallModal! */}
                <Pressable onPress={() => setShowPaywallModal(true)}>
                  <Text style={styles.planLimitText}>
                    {isPlus ? (
                      <>
                        Shotly Plus Active: Unlimited screenshots{' '}
                        <Text style={styles.planUpgradeLink}>Manage</Text>
                      </>
                    ) : (
                      <>
                        Free plan: {screenshots.length} of 500 organised{' '}
                        <Text style={styles.planUpgradeLink}>Upgrade</Text>
                      </>
                    )}
                  </Text>
                </Pressable>
              </View>

              {/* Categorised Screenshots Feed: Always visible photos on Home */}
              <View style={styles.section}>
                <View style={styles.feedHeaderRow}>
                  <Text style={styles.feedHeading}>
                    {activeCollection === 'All'
                      ? 'All Screenshots'
                      : `${activeCollection} Screenshots`}
                  </Text>
                  <Text style={styles.feedCountText}>
                    {collectionScreenshots.length}{' '}
                    {collectionScreenshots.length === 1 ? 'item' : 'items'}
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

      {/* Screenshot Full Inspector Modal matching Screenshot detail.png */}
      {selectedScreenshot && (
        <ScreenshotDetailModal
          screenshot={selectedScreenshot}
          visible={!!selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}

      {/* Clean-Up Modal matching Clean-Up.png */}
      {showCleanUpModal && (
        <CleanUpModal
          visible={showCleanUpModal}
          onClose={() => setShowCleanUpModal(false)}
        />
      )}

      {/* Paywall Modal matching Paywall.png */}
      {showPaywallModal && (
        <PaywallModal
          visible={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
        />
      )}

      {/* 24/7 Live AI Customer Support Modal */}
      <AISupportModal
        visible={showAiSupport}
        onClose={() => setShowAiSupport(false)}
        onOpenPaywall={() => setShowPaywallModal(true)}
        onOpenCleanUp={() => setShowCleanUpModal(true)}
        onOpenCollections={() => onCollectionPress && onCollectionPress('All')}
      />

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
    marginBottom: 20,
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiSupportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E2EE',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  aiSupportHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  onlineDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  aiSearchCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  aiSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiSearchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  aiSearchAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.ink,
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
  /* Modern Floating Pill Search Bar */
  floatingSearchPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
    marginBottom: 22,
    shadowColor: '#14181F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  floatingSearchPillFocused: {
    borderColor: BrandColors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  floatingSearchInput: {
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
  searchPillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  searchPillBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.muted,
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
  sectionMetaLink: {
    fontSize: 13,
    color: BrandColors.primary,
    fontWeight: '600',
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
  reviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  reviewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  reviewPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E11D48',
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
  planUpgradeLink: {
    color: BrandColors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
});
