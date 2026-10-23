import { Image } from 'expo-image';
import { Check, Trash, Xmark } from 'iconoir-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { ScreenshotItem, useScreenshots } from '@/hooks/use-screenshots';

interface CleanUpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CleanUpModal({ visible, onClose }: CleanUpModalProps) {
  const { screenshots, deleteScreenshot, markAsReviewed } = useScreenshots();
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const reviewItems = screenshots.filter((s) => s.needsReview);
  const displayItems = reviewItems.length > 0 ? reviewItems : screenshots.slice(0, 5);

  const currentScreenshot: ScreenshotItem | undefined = displayItems[currentIndex];

  const handleKeep = () => {
    if (currentScreenshot) {
      markAsReviewed(currentScreenshot.id);
    }
    if (currentIndex < displayItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsReviewing(false);
      setCurrentIndex(0);
    }
  };

  const handleDelete = () => {
    if (currentScreenshot) {
      deleteScreenshot(currentScreenshot.id);
    }
    if (currentIndex < displayItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsReviewing(false);
      setCurrentIndex(0);
    }
  };

  const freeableMB = (displayItems.length * 2.4).toFixed(0);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Xmark color={BrandColors.ink} width={22} height={22} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>{isReviewing ? 'Reviewing Screenshots' : 'Clean-Up'}</Text>
          <View style={{ width: 44 }} />
        </View>

        {!isReviewing ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              {/* Space You Can Free Card matching Clean-Up.png */}
              <View style={styles.spaceCard}>
                <Text style={styles.spaceLabel}>Space you can free</Text>
                <Text style={styles.spaceAmount}>{freeableMB} MB</Text>
              </View>

              {/* Stats Rows matching Clean-Up.png */}
              <View style={styles.statsList}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Duplicates</Text>
                  <Text style={styles.statCount}>[2]</Text>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Safe to delete</Text>
                  <Text style={styles.statCount}>[{displayItems.length}]</Text>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Needs review</Text>
                  <Text style={styles.statCount}>[{displayItems.length}]</Text>
                </View>
              </View>

              {/* Instructions matching Clean-Up.png */}
              <Text style={styles.instructionText}>
                Swipe right to keep, left to delete.
              </Text>

              {/* Start Review Button matching Clean-Up.png */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start review"
                onPress={() => {
                  setCurrentIndex(0);
                  setIsReviewing(true);
                }}
                style={({ pressed }) => [
                  styles.startReviewBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.startReviewBtnText}>Start review</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          /* Interactive Review Mode */
          <View style={styles.reviewContainer}>
            {currentScreenshot ? (
              <View style={styles.reviewCard}>
                <View style={styles.reviewImageContainer}>
                  <Image
                    source={{ uri: currentScreenshot.uri }}
                    style={styles.reviewImage}
                    contentFit="contain"
                  />
                </View>

                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewCategoryBadge}>
                    {currentScreenshot.category}
                  </Text>
                  <Text style={styles.reviewFilename} numberOfLines={1}>
                    {currentScreenshot.filename}
                  </Text>
                  <Text style={styles.reviewProgressText}>
                    {currentIndex + 1} of {displayItems.length}
                  </Text>
                </View>

                {/* Review Action Buttons */}
                <View style={styles.reviewActionsRow}>
                  <Pressable
                    onPress={handleDelete}
                    style={({ pressed }) => [
                      styles.actionCircleBtn,
                      styles.deleteCircleBtn,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Trash color="#DC2626" width={24} height={24} strokeWidth={2.2} />
                    <Text style={styles.deleteBtnLabel}>Delete</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleKeep}
                    style={({ pressed }) => [
                      styles.actionCircleBtn,
                      styles.keepCircleBtn,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Check color="#059669" width={24} height={24} strokeWidth={2.4} />
                    <Text style={styles.keepBtnLabel}>Keep</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.allDoneContainer}>
                <Text style={styles.allDoneTitle}>All Caught Up!</Text>
                <Text style={styles.allDoneSubtitle}>
                  You have reviewed all screenshots in your queue.
                </Text>
                <Pressable
                  onPress={onClose}
                  style={styles.startReviewBtn}>
                  <Text style={styles.startReviewBtnText}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  closeBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  contentContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  spaceCard: {
    backgroundColor: BrandColors.primary,
    borderRadius: 24,
    padding: 26,
    marginBottom: 28,
  },
  spaceLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  spaceAmount: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statsList: {
    marginBottom: 28,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  statLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: BrandColors.ink,
  },
  statCount: {
    fontSize: 17,
    fontWeight: '600',
    color: BrandColors.muted,
  },
  instructionText: {
    fontSize: 15,
    color: BrandColors.muted,
    marginBottom: 36,
  },
  startReviewBtn: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  reviewContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  reviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    justifyContent: 'space-between',
  },
  reviewImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  reviewMeta: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewCategoryBadge: {
    backgroundColor: '#EBF2FA',
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  reviewFilename: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  reviewProgressText: {
    fontSize: 12,
    color: BrandColors.muted,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  actionCircleBtn: {
    alignItems: 'center',
    gap: 4,
    padding: 12,
  },
  deleteCircleBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  deleteBtnLabel: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  keepCircleBtn: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  keepBtnLabel: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  allDoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  allDoneTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 8,
  },
  allDoneSubtitle: {
    fontSize: 14,
    color: BrandColors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
});
