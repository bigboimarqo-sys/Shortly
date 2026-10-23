import { Image } from 'expo-image';
import { Plus, Sparks, Xmark } from 'iconoir-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { PaywallModal } from '@/components/paywall-modal';
import { ScreenshotDetailModal } from '@/components/screenshot-detail-modal';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import {
  ScreenshotCategory,
  ScreenshotItem,
  useScreenshots,
} from '@/hooks/use-screenshots';

interface LibraryViewProps {
  onTabChange?: (tab: TabName) => void;
}

const CATEGORY_COLORS: Record<ScreenshotCategory, { bg: string; text: string }> = {
  Receipts: { bg: '#EBF2FA', text: '#38679B' },
  Recipes: { bg: '#FFF7ED', text: '#C2410C' },
  Work: { bg: '#EEF2FF', text: '#4338CA' },
  Chats: { bg: '#ECFDF5', text: '#047857' },
  Tickets: { bg: '#F5F3FF', text: '#6D28D9' },
  Maps: { bg: '#F0FDFA', text: '#0F766E' },
  Memes: { bg: '#FDF4FF', text: '#A21CAF' },
  Fashion: { bg: '#FFF1F2', text: '#BE123C' },
  Finance: { bg: '#F0FDF4', text: '#15803D' },
  Travel: { bg: '#EFF6FF', text: '#1D4ED8' },
  Other: { bg: '#F3F4F6', text: '#4B5563' },
};

const CATEGORIES: ScreenshotCategory[] = [
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

export function LibraryView({ onTabChange }: LibraryViewProps) {
  const {
    screenshots,
    isLoading,
    refreshScreenshots,
    pickScreenshotsFromPhone,
    importAllDeviceScreenshots,
  } = useScreenshots();

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const handleAutoImport = async () => {
    if (screenshots.length >= 500) {
      setShowImportModal(false);
      setShowPaywall(true);
      return;
    }
    setIsBulkImporting(true);
    try {
      const count = await importAllDeviceScreenshots();
      setShowImportModal(false);
      if (count > 0) {
        Alert.alert(
          'Import Complete',
          `Successfully imported and categorised ${count} ${
            count === 1 ? 'screenshot' : 'screenshots'
          } on-device.`
        );
      }
    } catch (err: any) {
      Alert.alert('Import Notice', err?.message || 'Failed to auto-import screenshots.');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handlePickFromPhotos = async () => {
    if (screenshots.length >= 500) {
      setShowImportModal(false);
      setShowPaywall(true);
      return;
    }
    setShowImportModal(false);
    try {
      const imported = await pickScreenshotsFromPhone(0); // 0 = unlimited / maximum selection allowed
      if (imported && imported.length > 0) {
        Alert.alert(
          'Import Complete',
          `Imported and categorised ${imported.length} ${
            imported.length === 1 ? 'screenshot' : 'screenshots'
          }.`
        );
      }
    } catch (err: any) {
      Alert.alert('Import Notice', err?.message || 'Could not access photo library.');
    }
  };

  const filters = ['All', ...CATEGORIES];

  // Filtered list
  const filteredScreenshots = useMemo(() => {
    if (activeFilter === 'All') return screenshots;
    return screenshots.filter(
      (s) => s.category.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [screenshots, activeFilter]);

  // Grouped by category when "All" is active
  const groupedCategories = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      items: screenshots.filter((s) => s.category === cat),
    })).filter((group) => group.items.length > 0);
  }, [screenshots]);

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
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Library</Text>
                <Text style={styles.subtitle}>
                  {filteredScreenshots.length} categorised{' '}
                  {filteredScreenshots.length === 1 ? 'screenshot' : 'screenshots'}
                </Text>
              </View>

              {/* Import Action */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Import photos from phone"
                onPress={() => {
                  if (screenshots.length >= 500) {
                    setShowPaywall(true);
                  } else {
                    setShowImportModal(true);
                  }
                }}
                style={({ pressed }) => [
                  styles.importButton,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}>
                <Plus color="#FFFFFF" width={16} height={16} strokeWidth={2.4} />
                <Text style={styles.importButtonText}>Import</Text>
              </Pressable>
            </View>
          </View>

          {/* Categorised Filter Pills Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {filters.map((filter) => {
              const isSelected = activeFilter === filter;
              const count =
                filter === 'All'
                  ? screenshots.length
                  : screenshots.filter(
                      (s) => s.category.toLowerCase() === filter.toLowerCase()
                    ).length;

              return (
                <Pressable
                  key={filter}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${filter}, ${count} items`}
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
                    {filter} {count > 0 ? `(${count})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Categorised Screenshots View */}
          {activeFilter === 'All' ? (
            /* Show Grouped by Categories */
            <View style={styles.groupedSection}>
              {groupedCategories.map((group) => {
                const colorScheme =
                  CATEGORY_COLORS[group.category] || CATEGORY_COLORS.Other;
                return (
                  <View key={group.category} style={styles.categoryBlock}>
                    <View style={styles.categoryBlockHeader}>
                      <View style={styles.categoryTitleBadge}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: colorScheme.text },
                          ]}
                        />
                        <Text style={styles.categoryBlockTitle}>{group.category}</Text>
                        <Text style={styles.categoryBlockCount}>
                          ({group.items.length})
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setActiveFilter(group.category)}
                        style={styles.seeAllBtn}>
                        <Text style={styles.seeAllBtnText}>See all</Text>
                      </Pressable>
                    </View>

                    {/* Horizontal scroll of screenshots for this category */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryCardsRow}>
                      {group.items.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => setSelectedScreenshot(item)}
                          style={({ pressed }) => [
                            styles.categoryCard,
                            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                          ]}>
                          <Image
                            source={{ uri: item.uri }}
                            style={styles.categoryCardImage}
                            contentFit="cover"
                            transition={150}
                            cachePolicy="memory-disk"
                          />
                          <View style={styles.categoryCardFooter}>
                            <Text style={styles.categoryCardFilename} numberOfLines={1}>
                              {item.filename}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                );
              })}

              {/* Complete 3-Column Grid matching Library.png */}
              <View style={styles.allGridSection}>
                <Text style={styles.allGridSectionTitle}>All Photos Grid</Text>
                <View style={styles.grid}>
                  {screenshots.map((item) => {
                    const colorScheme =
                      CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => setSelectedScreenshot(item)}
                        style={({ pressed }) => [
                          styles.gridItem,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                        ]}>
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.gridImage}
                          contentFit="cover"
                          transition={150}
                          cachePolicy="memory-disk"
                        />
                        <View
                          style={[
                            styles.gridCategoryBadge,
                            { backgroundColor: colorScheme.bg },
                          ]}>
                          <Text
                            style={[
                              styles.gridCategoryBadgeText,
                              { color: colorScheme.text },
                            ]}
                            numberOfLines={1}>
                            {item.category}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : (
            /* Show Selected Category Grid */
            <View style={styles.filteredGridSection}>
              <View style={styles.grid}>
                {filteredScreenshots.map((item) => {
                  const colorScheme =
                    CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedScreenshot(item)}
                      style={({ pressed }) => [
                        styles.gridItem,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.gridImage}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                      <View
                        style={[
                          styles.gridCategoryBadge,
                          { backgroundColor: colorScheme.bg },
                        ]}>
                        <Text
                          style={[
                            styles.gridCategoryBadgeText,
                            { color: colorScheme.text },
                          ]}
                          numberOfLines={1}>
                          {item.category}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Screenshot Detail Inspector Modal */}
      {selectedScreenshot && (
        <ScreenshotDetailModal
          screenshot={selectedScreenshot}
          visible={!!selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}

      {/* Persistent Bottom Tab Bar */}
      <BottomTabBar
        activeTab="Library"
        onTabPress={(tab) => onTabChange && onTabChange(tab)}
      />

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImportModal(false)}>
        <View style={styles.importModalBackdrop}>
          <View style={styles.importModalContent}>
            {/* Header */}
            <View style={styles.importModalHeader}>
              <View>
                <Text style={styles.importModalTitle}>Import Screenshots</Text>
                <Text style={styles.importModalSubtitle}>
                  Import maximum photos into your private library
                </Text>
              </View>
              <Pressable
                onPress={() => setShowImportModal(false)}
                style={({ pressed }) => [styles.importCloseBtn, pressed && { opacity: 0.7 }]}>
                <Xmark color={BrandColors.ink} width={20} height={20} strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Storage capacity indicator */}
            <View style={styles.capacityBanner}>
              <View style={styles.capacityHeader}>
                <Text style={styles.capacityLabel}>Free Tier Storage</Text>
                <Text style={styles.capacityValue}>
                  {screenshots.length} / 500 screenshots used
                </Text>
              </View>
              <View style={styles.capacityProgressBar}>
                <View
                  style={[
                    styles.capacityProgressFill,
                    {
                      width: `${Math.min(
                        100,
                        Math.max(5, (screenshots.length / 500) * 100)
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Import Options */}
            <View style={styles.importOptionsList}>
              {/* Option 1: Auto-Import All Device Screenshots */}
              <Pressable
                disabled={isBulkImporting}
                onPress={handleAutoImport}
                style={({ pressed }) => [
                  styles.importOptionCard,
                  styles.importOptionCardPrimary,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}>
                <View style={styles.optionBadgePrimary}>
                  <Sparks color="#FFFFFF" width={14} height={14} strokeWidth={2.4} />
                  <Text style={styles.optionBadgePrimaryText}>MAXIMUM / BULK</Text>
                </View>
                <Text style={styles.importOptionTitlePrimary}>
                  Auto-Import All Device Screenshots
                </Text>
                <Text style={styles.importOptionDescPrimary}>
                  Automatically scans your device for all screenshots (up to 500) and categorises them on-device.
                </Text>
                <View style={styles.importOptionButtonPrimary}>
                  {isBulkImporting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.importOptionButtonPrimaryText}>
                      Import All Screenshots (Up to 500)
                    </Text>
                  )}
                </View>
              </Pressable>

              {/* Option 2: Select Photos Manually (Unlimited Multi-Select) */}
              <Pressable
                disabled={isBulkImporting}
                onPress={handlePickFromPhotos}
                style={({ pressed }) => [
                  styles.importOptionCard,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.importOptionTitleSecondary}>
                  Select from Photo Gallery
                </Text>
                <Text style={styles.importOptionDescSecondary}>
                  Choose as many screenshots as you want with unlimited multi-selection enabled.
                </Text>
                <View style={styles.importOptionButtonSecondary}>
                  <Text style={styles.importOptionButtonSecondaryText}>
                    Open Photo Picker (Unlimited)
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Privacy notice */}
            <View style={styles.importFooter}>
              <Text style={styles.importFooterText}>
                🔒 100% on-device privacy. Images and text never leave your phone.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
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
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
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
  subtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  filterPillActive: {
    backgroundColor: BrandColors.primary,
  },
  filterPillInactive: {
    backgroundColor: '#EAE7DF',
  },
  filterText: {
    fontSize: 14,
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
  groupedSection: {
    gap: 24,
  },
  categoryBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  categoryBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryBlockTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  categoryBlockCount: {
    fontSize: 13,
    color: BrandColors.muted,
    fontWeight: '600',
  },
  seeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  categoryCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    width: 140,
    aspectRatio: 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  categoryCardImage: {
    width: '100%',
    height: '75%',
  },
  categoryCardFooter: {
    height: '25%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  categoryCardFilename: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  allGridSection: {
    marginTop: 8,
  },
  allGridSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 12,
  },
  filteredGridSection: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '31.3%',
    aspectRatio: 0.85,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#DCE3EB',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridCategoryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  gridCategoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  importModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.55)',
    justifyContent: 'flex-end',
  },
  importModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  importModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  importModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  importModalSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 2,
  },
  importCloseBtn: {
    padding: 8,
    backgroundColor: BrandColors.paper,
    borderRadius: 16,
  },
  capacityBanner: {
    backgroundColor: BrandColors.paper,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  capacityValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  capacityProgressBar: {
    height: 6,
    backgroundColor: '#E0DDD3',
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityProgressFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: 3,
  },
  importOptionsList: {
    gap: 14,
    marginBottom: 16,
  },
  importOptionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 18,
    padding: 16,
  },
  importOptionCardPrimary: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F8FAFC',
  },
  optionBadgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  optionBadgePrimaryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  importOptionTitlePrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  importOptionDescPrimary: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.muted,
    marginBottom: 12,
  },
  importOptionButtonPrimary: {
    height: 44,
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importOptionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  importOptionTitleSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  importOptionDescSecondary: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.muted,
    marginBottom: 12,
  },
  importOptionButtonSecondary: {
    height: 44,
    backgroundColor: BrandColors.paper,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importOptionButtonSecondaryText: {
    color: BrandColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  importFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EEE8',
  },
  importFooterText: {
    fontSize: 12,
    color: BrandColors.muted,
    textAlign: 'center',
  },
});
