import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { ScreenshotItem, useScreenshots } from '@/hooks/use-screenshots';

interface LibraryViewProps {
  onTabChange?: (tab: TabName) => void;
}

export function LibraryView({ onTabChange }: LibraryViewProps) {
  const { screenshots, isLoading, refreshScreenshots, pickScreenshotsFromPhone } = useScreenshots();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);

  const filters = ['All', 'Receipts', 'Recipes', 'Work', 'Chats', 'Tickets', 'Maps'];

  const filteredScreenshots =
    activeFilter === 'All'
      ? screenshots
      : screenshots.filter(
        (s) => s.category.toLowerCase() === activeFilter.toLowerCase()
      );

  // Show filtered screenshots or minimum 25 slots matching Library.png
  const displayCount = Math.max(filteredScreenshots.length, 18);
  const items = Array.from({ length: displayCount }, (_, i) => i);

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
                  {filteredScreenshots.length} {filteredScreenshots.length === 1 ? 'screenshot' : 'screenshots'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  pickScreenshotsFromPhone();
                }}
                style={styles.importButton}>
                <Text style={styles.importButtonText}>+ Import</Text>
              </Pressable>
            </View>
          </View>

          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
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
          </ScrollView>

          {/* 3-column Grid matching Library.png */}
          <View style={styles.grid}>
            {items.map((index) => {
              const item = filteredScreenshots[index];
              return (
                <Pressable
                  key={item?.id ?? index}
                  onPress={() => item && setSelectedScreenshot(item)}
                  style={({ pressed }) => [
                    styles.gridItem,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}>
                  {item ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={150}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.gridPlaceholder} />
                  )}
                </Pressable>
              );
            })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  importButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
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
