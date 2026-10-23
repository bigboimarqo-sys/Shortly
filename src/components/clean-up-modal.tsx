import { Image } from 'expo-image';
import { Check, NavArrowRight, ShareAndroid, Sparks, Trash, Xmark } from 'iconoir-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { ScreenshotItem, useScreenshots } from '@/hooks/use-screenshots';
import { shareScreenshotImage } from '@/services/share-service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 110;

interface CleanUpModalProps {
  visible: boolean;
  onClose: () => void;
}

type CleanUpFilter = 'all' | 'duplicates' | 'safe_to_delete' | 'needs_review';

export function CleanUpModal({ visible, onClose }: CleanUpModalProps) {
  const { screenshots, deleteScreenshot, markAsReviewed } = useScreenshots();

  // Review states
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<CleanUpFilter>('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stats in current session
  const [sessionKeptCount, setSessionKeptCount] = useState(0);
  const [sessionDeletedCount, setSessionDeletedCount] = useState(0);
  const [sessionFreedMB, setSessionFreedMB] = useState(0);

  // Device deletion permission preference
  const [deleteFromDeviceDefault, setDeleteFromDeviceDefault] = useState(true);
  const [alwaysApplyDeviceChoice, setAlwaysApplyDeviceChoice] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingItemToDelete, setPendingItemToDelete] = useState<ScreenshotItem | null>(null);

  // Fullscreen Inspection Modal
  const [inspectedScreenshot, setInspectedScreenshot] = useState<ScreenshotItem | null>(null);

  // Animated pan value for swipe gestures
  const pan = useRef(new Animated.ValueXY()).current;

  // Categorize screenshots into cleanup queues
  const duplicatesList = useMemo(() => {
    // Group by category/content cues or mark demo duplicates
    return screenshots.filter(
      (s, idx) =>
        s.tags.includes('duplicate') ||
        idx === 0 ||
        s.filename.toLowerCase().includes('duplicate')
    );
  }, [screenshots]);

  const safeToDeleteList = useMemo(() => {
    // Temporary codes, OTPs, old memes, receipts
    return screenshots.filter(
      (s) =>
        s.category === 'Memes' ||
        s.category === 'Receipts' ||
        s.ocrText.toLowerCase().includes('otp') ||
        s.ocrText.toLowerCase().includes('code') ||
        s.tags.includes('safe_delete')
    );
  }, [screenshots]);

  const needsReviewList = useMemo(() => {
    const unreviewed = screenshots.filter((s) => s.needsReview);
    return unreviewed.length > 0 ? unreviewed : screenshots.slice(0, 8);
  }, [screenshots]);

  // Active queue based on chosen filter
  const activeQueue = useMemo(() => {
    switch (activeFilter) {
      case 'duplicates':
        return duplicatesList.length > 0 ? duplicatesList : screenshots.slice(0, 4);
      case 'safe_to_delete':
        return safeToDeleteList.length > 0 ? safeToDeleteList : screenshots.slice(0, 5);
      case 'needs_review':
        return needsReviewList;
      case 'all':
      default: {
        const set = new Set<string>();
        const combined: ScreenshotItem[] = [];
        [...duplicatesList, ...safeToDeleteList, ...needsReviewList, ...screenshots].forEach(
          (item) => {
            if (!set.has(item.id)) {
              set.add(item.id);
              combined.push(item);
            }
          }
        );
        return combined.length > 0 ? combined : screenshots;
      }
    }
  }, [activeFilter, duplicatesList, safeToDeleteList, needsReviewList, screenshots]);

  const currentScreenshot: ScreenshotItem | undefined = activeQueue[currentIndex];
  const totalInQueue = activeQueue.length;
  const freeableMBTotal = (activeQueue.length * 2.4).toFixed(1);

  // Advance to next card in queue
  const advanceToNext = () => {
    pan.setValue({ x: 0, y: 0 });
    if (currentIndex < activeQueue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsReviewing(false);
      setCurrentIndex(0);
    }
  };

  // Reset card back to center
  const resetCardPosition = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  // 1. KEEP File (Swipe Right or Tap Keep)
  const executeKeep = (itemToKeep?: ScreenshotItem) => {
    const item = itemToKeep || currentScreenshot;
    if (item) {
      markAsReviewed(item.id);
      setSessionKeptCount((c) => c + 1);
    }
    advanceToNext();
  };

  const handleKeepAnimated = () => {
    Animated.timing(pan, {
      toValue: { x: SCREEN_WIDTH + 80, y: 20 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      executeKeep();
    });
  };

  // 2. DELETE File (Swipe Left or Tap Delete)
  const requestDelete = (itemToDelete?: ScreenshotItem) => {
    const target = itemToDelete || currentScreenshot;
    if (!target) return;

    if (alwaysApplyDeviceChoice) {
      // If user already specified preference for this session
      performDeleteExecution(target, deleteFromDeviceDefault);
    } else {
      // Prompt user with permission dialog to delete from device gallery
      setPendingItemToDelete(target);
      setShowPermissionDialog(true);
    }
  };

  const handleDeleteAnimated = () => {
    Animated.timing(pan, {
      toValue: { x: -SCREEN_WIDTH - 80, y: 20 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      requestDelete();
    });
  };

  const performDeleteExecution = async (
    target: ScreenshotItem,
    deleteFromDeviceGallery: boolean
  ) => {
    setShowPermissionDialog(false);
    setPendingItemToDelete(null);

    try {
      const res = await deleteScreenshot(target.id, deleteFromDeviceGallery);
      setSessionDeletedCount((c) => c + 1);
      setSessionFreedMB((mb) => +(mb + 2.4).toFixed(1));

      if (deleteFromDeviceGallery && !res.deletedFromDevice && Platform.OS !== 'web') {
        Alert.alert(
          'Device Photo Kept',
          'Screenshot removed from Shotly. Device photo library deletion was declined by system permission.'
        );
      }
    } catch (err) {
      console.warn('Error during cleanup delete:', err);
    }

    advanceToNext();
  };

  // PanResponder for smooth Tinder-style swipe gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            // Swiped Right -> KEEP
            Animated.timing(pan, {
              toValue: { x: SCREEN_WIDTH + 80, y: gesture.dy },
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              executeKeep();
            });
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            // Swiped Left -> DELETE
            Animated.timing(pan, {
              toValue: { x: -SCREEN_WIDTH - 80, y: gesture.dy },
              duration: 200,
              useNativeDriver: false,
            }).start(() => {
              requestDelete();
            });
          } else {
            // Return back to center
            resetCardPosition();
          }
        },
      }),
    [currentScreenshot, currentIndex, activeQueue.length, alwaysApplyDeviceChoice, deleteFromDeviceDefault]
  );

  // Card rotation & stamp badge interpolations
  const cardRotation = pan.x.interpolate({
    inputRange: [-240, 0, 240],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const keepStampOpacity = pan.x.interpolate({
    inputRange: [25, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const deleteStampOpacity = pan.x.interpolate({
    inputRange: [-90, -25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Handler to start reviewing from a specific tapped placeholder
  const handleStartReviewFromItem = (item: ScreenshotItem, filter: CleanUpFilter = 'all') => {
    setActiveFilter(filter);
    const targetIdx = activeQueue.findIndex((s) => s.id === item.id);
    setCurrentIndex(targetIdx >= 0 ? targetIdx : 0);
    pan.setValue({ x: 0, y: 0 });
    setIsReviewing(true);
  };

  const handleStartReviewCategory = (filter: CleanUpFilter) => {
    setActiveFilter(filter);
    setCurrentIndex(0);
    pan.setValue({ x: 0, y: 0 });
    setIsReviewing(true);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close clean-up"
            onPress={onClose}
            style={styles.closeBtn}>
            <Xmark color={BrandColors.ink} width={22} height={22} strokeWidth={2.4} />
          </Pressable>

          <Text style={styles.headerTitle}>
            {isReviewing
              ? `Review (${currentIndex + 1}/${totalInQueue})`
              : 'Clean-Up'}
          </Text>

          {isReviewing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exit review mode"
              onPress={() => {
                pan.setValue({ x: 0, y: 0 });
                setIsReviewing(false);
              }}
              style={styles.headerPillBtn}>
              <Text style={styles.headerPillText}>Summary</Text>
            </Pressable>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {!isReviewing ? (
          /* ========================================================= */
          /* 1. CLEAN-UP OVERVIEW & CLICKABLE PLACEHOLDERS             */
          /* ========================================================= */
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              {/* Space You Can Free Card matching Clean-Up.png */}
              <View style={styles.spaceCard}>
                <View style={styles.spaceCardTop}>
                  <Text style={styles.spaceLabel}>Space you can free</Text>
                  <View style={styles.spaceBadge}>
                    <Sparks color="#FFFFFF" width={14} height={14} strokeWidth={2.5} />
                    <Text style={styles.spaceBadgeText}>Smart scan</Text>
                  </View>
                </View>
                <Text style={styles.spaceAmount}>{freeableMBTotal} MB</Text>
                <Text style={styles.spaceSubtext}>
                  {activeQueue.length} screenshots ready for review
                </Text>
              </View>

              {/* SECTION: Clickable Placeholders Carousel */}
              <View style={styles.placeholdersSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Screenshots to review</Text>
                  <Text style={styles.sectionCountText}>
                    Tap any item to start
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.placeholdersScroll}>
                  {activeQueue.map((item, index) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Review screenshot ${item.filename}`}
                      onPress={() => handleStartReviewFromItem(item)}
                      style={({ pressed }) => [
                        styles.placeholderCard,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.placeholderImage}
                        contentFit="cover"
                        transition={200}
                      />
                      <View style={styles.placeholderOverlay}>
                        <View style={styles.placeholderBadge}>
                          <Text style={styles.placeholderBadgeText}>
                            {item.category}
                          </Text>
                        </View>
                        <Text style={styles.placeholderFilename} numberOfLines={1}>
                          {item.filename}
                        </Text>
                        <View style={styles.placeholderActionPill}>
                          <Text style={styles.placeholderActionText}>
                            Tap to review #{index + 1}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* SECTION: Clickable Stats Rows matching Clean-Up.png */}
              <View style={styles.statsCardContainer}>
                <Text style={styles.statsCardHeader}>Clean-up categories</Text>

                {/* Duplicates Row (Clickable) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Review duplicates"
                  onPress={() => handleStartReviewCategory('duplicates')}
                  style={({ pressed }) => [
                    styles.statRowPressable,
                    pressed && { backgroundColor: '#F0ECE1' },
                  ]}>
                  <View style={styles.statLeft}>
                    <Text style={styles.statIcon}>👯</Text>
                    <View>
                      <Text style={styles.statLabel}>Duplicates</Text>
                      <Text style={styles.statDesc}>Similar captures &amp; copies</Text>
                    </View>
                  </View>
                  <View style={styles.statRight}>
                    <Text style={styles.statCount}>[{duplicatesList.length}]</Text>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} strokeWidth={2.4} />
                  </View>
                </Pressable>

                {/* Safe to delete Row (Clickable) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Review safe to delete items"
                  onPress={() => handleStartReviewCategory('safe_to_delete')}
                  style={({ pressed }) => [
                    styles.statRowPressable,
                    pressed && { backgroundColor: '#F0ECE1' },
                  ]}>
                  <View style={styles.statLeft}>
                    <Text style={styles.statIcon}>⚡</Text>
                    <View>
                      <Text style={styles.statLabel}>Safe to delete</Text>
                      <Text style={styles.statDesc}>Old receipts, temporary OTPs</Text>
                    </View>
                  </View>
                  <View style={styles.statRight}>
                    <Text style={styles.statCount}>[{safeToDeleteList.length}]</Text>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} strokeWidth={2.4} />
                  </View>
                </Pressable>

                {/* Needs review Row (Clickable) */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Review all unsorted screenshots"
                  onPress={() => handleStartReviewCategory('needs_review')}
                  style={({ pressed }) => [
                    styles.statRowPressable,
                    styles.statRowLast,
                    pressed && { backgroundColor: '#F0ECE1' },
                  ]}>
                  <View style={styles.statLeft}>
                    <Text style={styles.statIcon}>🔍</Text>
                    <View>
                      <Text style={styles.statLabel}>Needs review</Text>
                      <Text style={styles.statDesc}>Unsorted captures</Text>
                    </View>
                  </View>
                  <View style={styles.statRight}>
                    <Text style={styles.statCount}>[{needsReviewList.length}]</Text>
                    <NavArrowRight color={BrandColors.muted} width={18} height={18} strokeWidth={2.4} />
                  </View>
                </Pressable>
              </View>

              {/* Instructions matching Clean-Up.png */}
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>Swipe gestures</Text>
                <Text style={styles.instructionText}>
                  👉 <Text style={styles.boldText}>Swipe Right</Text> to keep files in your library.{'\n'}
                  👈 <Text style={styles.boldText}>Swipe Left</Text> to delete files and free up phone storage.
                </Text>
              </View>

              {/* Permission to Delete from Device Gallery Setting */}
              <View style={styles.devicePermissionCard}>
                <View style={styles.devicePermissionLeft}>
                  <Text style={styles.devicePermTitle}>Delete from device gallery</Text>
                  <Text style={styles.devicePermDesc}>
                    When deleting, request OS permission to permanently remove photos from phone storage.
                  </Text>
                </View>
                <Switch
                  value={deleteFromDeviceDefault}
                  onValueChange={setDeleteFromDeviceDefault}
                  trackColor={{ false: '#D1D5DB', true: BrandColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Start Review Button matching Clean-Up.png */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start swipe review"
                onPress={() => handleStartReviewCategory('all')}
                style={({ pressed }) => [
                  styles.startReviewBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.startReviewBtnText}>Start review</Text>
              </Pressable>

              {/* Summary of this session if user cleaned items */}
              {(sessionKeptCount > 0 || sessionDeletedCount > 0) && (
                <View style={styles.sessionSummaryCard}>
                  <Text style={styles.sessionSummaryTitle}>Session Progress</Text>
                  <Text style={styles.sessionSummaryText}>
                    ✅ {sessionKeptCount} kept · 🗑️ {sessionDeletedCount} deleted ({sessionFreedMB} MB freed)
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          /* ========================================================= */
          /* 2. INTERACTIVE SWIPE REVIEW (SWIPE RIGHT KEEP / LEFT DELETE) */
          /* ========================================================= */
          <View style={styles.reviewContainer}>
            {currentScreenshot ? (
              <View style={styles.swipeArea}>
                {/* Visual Directional Guides */}
                <View style={styles.guidePillRow}>
                  <View style={styles.guidePillLeft}>
                    <Text style={styles.guidePillLeftText}>👈 SWIPE LEFT TO DELETE</Text>
                  </View>
                  <View style={styles.guidePillRight}>
                    <Text style={styles.guidePillRightText}>SWIPE RIGHT TO KEEP 👉</Text>
                  </View>
                </View>

                {/* The Interactive Draggable & Clickable Card */}
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.reviewCard,
                    {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { rotate: cardRotation },
                      ],
                    },
                  ]}>
                  {/* Floating Stamps during dragging */}
                  {/* KEEP Stamp (Top-Right, Green) */}
                  <Animated.View
                    style={[
                      styles.stampBadge,
                      styles.keepStamp,
                      { opacity: keepStampOpacity },
                    ]}>
                    <Check color="#059669" width={22} height={22} strokeWidth={3.5} />
                    <Text style={styles.keepStampText}>KEEP</Text>
                  </Animated.View>

                  {/* DELETE Stamp (Top-Left, Red) */}
                  <Animated.View
                    style={[
                      styles.stampBadge,
                      styles.deleteStamp,
                      { opacity: deleteStampOpacity },
                    ]}>
                    <Trash color="#DC2626" width={22} height={22} strokeWidth={3.5} />
                    <Text style={styles.deleteStampText}>DELETE</Text>
                  </Animated.View>

                  {/* Clickable Image Container (Tap to inspect zoom) */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Click to zoom screenshot"
                    onPress={() => setInspectedScreenshot(currentScreenshot)}
                    style={styles.reviewImageContainer}>
                    <Image
                      source={{ uri: currentScreenshot.uri }}
                      style={styles.reviewImage}
                      contentFit="contain"
                    />
                    <View style={styles.zoomHintBadge}>
                      <Text style={styles.zoomHintText}>🔍 Tap to inspect</Text>
                    </View>
                  </Pressable>

                  {/* Screenshot Metadata info */}
                  <View style={styles.reviewMeta}>
                    <View style={styles.reviewTagRow}>
                      <Text style={styles.reviewCategoryBadge}>
                        {currentScreenshot.category}
                      </Text>
                      {currentScreenshot.tags.map((tag) => (
                        <Text key={tag} style={styles.reviewMetaPill}>
                          #{tag}
                        </Text>
                      ))}
                    </View>
                    <Text style={styles.reviewFilename} numberOfLines={1}>
                      {currentScreenshot.filename}
                    </Text>
                    <Text style={styles.reviewOcrSnippet} numberOfLines={2}>
                      {currentScreenshot.ocrText}
                    </Text>
                  </View>
                </Animated.View>

                {/* Review Action Buttons (Clickable Alternatives to Swiping) */}
                <View style={styles.reviewActionsRow}>
                  {/* Left Delete Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete this screenshot"
                    onPress={handleDeleteAnimated}
                    style={({ pressed }) => [
                      styles.actionCircleBtn,
                      styles.deleteCircleBtn,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                    ]}>
                    <Trash color="#DC2626" width={26} height={26} strokeWidth={2.4} />
                    <Text style={styles.deleteBtnLabel}>Delete</Text>
                  </Pressable>

                  {/* Center Zoom Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Zoom and inspect details"
                    onPress={() => setInspectedScreenshot(currentScreenshot)}
                    style={({ pressed }) => [
                      styles.centerInspectBtn,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Text style={styles.inspectBtnText}>Inspect</Text>
                  </Pressable>

                  {/* Right Keep Button */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Keep this screenshot"
                    onPress={handleKeepAnimated}
                    style={({ pressed }) => [
                      styles.actionCircleBtn,
                      styles.keepCircleBtn,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
                    ]}>
                    <Check color="#059669" width={26} height={26} strokeWidth={2.6} />
                    <Text style={styles.keepBtnLabel}>Keep</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* All Reviewed Screen */
              <View style={styles.allDoneContainer}>
                <View style={styles.allDoneIconCircle}>
                  <Check color="#FFFFFF" width={48} height={48} strokeWidth={3.5} />
                </View>
                <Text style={styles.allDoneTitle}>All Cleaned Up!</Text>
                <Text style={styles.allDoneSubtitle}>
                  You reviewed all {activeQueue.length} screenshots in this queue.
                </Text>

                <View style={styles.completedStatsCard}>
                  <View style={styles.completedStatCol}>
                    <Text style={styles.completedStatNum}>{sessionKeptCount}</Text>
                    <Text style={styles.completedStatLabel}>Kept</Text>
                  </View>
                  <View style={styles.completedStatDivider} />
                  <View style={styles.completedStatCol}>
                    <Text style={styles.completedStatNum}>{sessionDeletedCount}</Text>
                    <Text style={styles.completedStatLabel}>Deleted</Text>
                  </View>
                  <View style={styles.completedStatDivider} />
                  <View style={styles.completedStatCol}>
                    <Text style={[styles.completedStatNum, { color: BrandColors.primary }]}>
                      {sessionFreedMB} MB
                    </Text>
                    <Text style={styles.completedStatLabel}>Freed</Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Finished clean-up"
                  onPress={onClose}
                  style={styles.startReviewBtn}>
                  <Text style={styles.startReviewBtnText}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* PERMISSION MODAL: DELETE FROM DEVICE GALLERY               */}
        {/* ========================================================= */}
        <Modal
          visible={showPermissionDialog}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {
            setShowPermissionDialog(false);
            resetCardPosition();
          }}>
          <View style={styles.dialogBackdrop}>
            <View style={styles.dialogCard}>
              <View style={styles.dialogIconBox}>
                <Trash color="#DC2626" width={32} height={32} strokeWidth={2.4} />
              </View>

              <Text style={styles.dialogTitle}>Delete from device?</Text>
              <Text style={styles.dialogBody}>
                Do you want to permanently delete{' '}
                <Text style={{ fontWeight: '700' }}>
                  {pendingItemToDelete?.filename || 'this screenshot'}
                </Text>{' '}
                from your phone’s photo library as well?
              </Text>

              {/* Remember choice toggle */}
              <View style={styles.dialogRememberRow}>
                <Text style={styles.dialogRememberText}>
                  Remember my choice for this review
                </Text>
                <Switch
                  value={alwaysApplyDeviceChoice}
                  onValueChange={setAlwaysApplyDeviceChoice}
                  trackColor={{ false: '#D1D5DB', true: BrandColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.dialogActions}>
                {/* 1. Delete from Device & Shotly */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete from device and Shotly"
                  onPress={() => {
                    if (pendingItemToDelete) {
                      performDeleteExecution(pendingItemToDelete, true);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.dialogButtonDestructive,
                    pressed && { opacity: 0.9 },
                  ]}>
                  <Text style={styles.dialogButtonDestructiveText}>
                    Delete from Device &amp; Shotly
                  </Text>
                </Pressable>

                {/* 2. Remove from Shotly Only */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove from Shotly only"
                  onPress={() => {
                    if (pendingItemToDelete) {
                      performDeleteExecution(pendingItemToDelete, false);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.dialogButtonNeutral,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={styles.dialogButtonNeutralText}>
                    Remove from Shotly Only
                  </Text>
                </Pressable>

                {/* 3. Cancel */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancel deletion"
                  onPress={() => {
                    setShowPermissionDialog(false);
                    setPendingItemToDelete(null);
                    resetCardPosition();
                  }}
                  style={styles.dialogButtonCancel}>
                  <Text style={styles.dialogButtonCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ========================================================= */}
        {/* FULLSCREEN INSPECT MODAL                                  */}
        {/* ========================================================= */}
        <Modal
          visible={!!inspectedScreenshot}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setInspectedScreenshot(null)}>
          <View style={styles.inspectBackdrop}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.inspectHeader}>
                <Text style={styles.inspectTitle} numberOfLines={1}>
                  {inspectedScreenshot?.filename}
                </Text>
                <View style={styles.inspectActionRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share screenshot image"
                    onPress={() => {
                      if (inspectedScreenshot) {
                        shareScreenshotImage(
                          inspectedScreenshot.uri,
                          inspectedScreenshot.filename
                        );
                      }
                    }}
                    style={({ pressed }) => [
                      styles.inspectShareBtn,
                      pressed && { opacity: 0.7 },
                    ]}>
                    <ShareAndroid color="#FFFFFF" width={22} height={22} strokeWidth={2.4} />
                  </Pressable>
                  <Pressable
                    onPress={() => setInspectedScreenshot(null)}
                    style={styles.inspectCloseBtn}>
                    <Xmark color="#FFFFFF" width={24} height={24} strokeWidth={2.4} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inspectImageContainer}>
                {inspectedScreenshot && (
                  <Image
                    source={{ uri: inspectedScreenshot.uri }}
                    style={styles.inspectFullImage}
                    contentFit="contain"
                  />
                )}
              </View>

              <View style={styles.inspectFooter}>
                <Text style={styles.inspectOcrText}>
                  {inspectedScreenshot?.ocrText || 'No text extracted'}
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    borderRadius: 14,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  headerPillBtn: {
    backgroundColor: '#EAE7DF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
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
    padding: 24,
    marginBottom: 24,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  spaceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  spaceLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  spaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spaceBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  spaceAmount: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  spaceSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  // Placeholders Section
  placeholdersSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.ink,
    letterSpacing: -0.3,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  placeholdersScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  placeholderCard: {
    width: 140,
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 24, 31, 0.45)',
    padding: 10,
    justifyContent: 'space-between',
  },
  placeholderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  placeholderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.ink,
    textTransform: 'uppercase',
  },
  placeholderFilename: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholderActionPill: {
    backgroundColor: BrandColors.primary,
    borderRadius: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  placeholderActionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  // Stats Rows matching Clean-Up.png
  statsCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  statsCardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  statRowPressable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIcon: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  statDesc: {
    fontSize: 12,
    color: BrandColors.muted,
    marginTop: 2,
  },
  statRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statCount: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  instructionsBox: {
    backgroundColor: '#FAF9F5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 20,
    color: BrandColors.muted,
  },
  boldText: {
    fontWeight: '700',
    color: BrandColors.ink,
  },
  devicePermissionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginBottom: 24,
  },
  devicePermissionLeft: {
    flex: 1,
    paddingRight: 14,
  },
  devicePermTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  devicePermDesc: {
    fontSize: 12,
    color: BrandColors.muted,
    lineHeight: 16,
  },
  startReviewBtn: {
    height: 56,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  startReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  sessionSummaryCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sessionSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sessionSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
  },
  // Swipe Review Mode Styles
  reviewContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  swipeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  guidePillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  guidePillLeft: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  guidePillLeftText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '800',
  },
  guidePillRight: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  guidePillRightText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  reviewCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    justifyContent: 'space-between',
  },
  stampBadge: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 3,
  },
  keepStamp: {
    right: 24,
    borderColor: '#059669',
    backgroundColor: 'rgba(220, 252, 231, 0.95)',
    transform: [{ rotate: '12deg' }],
  },
  keepStampText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  deleteStamp: {
    left: 24,
    borderColor: '#DC2626',
    backgroundColor: 'rgba(254, 226, 226, 0.95)',
    transform: [{ rotate: '-12deg' }],
  },
  deleteStampText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
  },
  reviewImageContainer: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  zoomHintBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  zoomHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  reviewMeta: {
    paddingTop: 12,
  },
  reviewTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reviewCategoryBadge: {
    backgroundColor: '#EBF2FA',
    color: BrandColors.primary,
    fontWeight: '800',
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    textTransform: 'uppercase',
  },
  reviewMetaPill: {
    fontSize: 12,
    color: BrandColors.muted,
    fontWeight: '600',
  },
  reviewFilename: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  reviewOcrSnippet: {
    fontSize: 12,
    color: BrandColors.muted,
    lineHeight: 16,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 10,
  },
  actionCircleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 110,
    height: 70,
    borderRadius: 22,
  },
  deleteCircleBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  deleteBtnLabel: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  centerInspectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#EAE7DF',
  },
  inspectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  keepCircleBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  keepBtnLabel: {
    color: '#059669',
    fontWeight: '800',
    fontSize: 13,
  },
  // Completion screen
  allDoneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  allDoneIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  allDoneTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BrandColors.ink,
    marginBottom: 8,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  allDoneSubtitle: {
    fontSize: 15,
    color: BrandColors.muted,
    textAlign: 'center',
    marginBottom: 28,
  },
  completedStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    width: '100%',
    marginBottom: 32,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  completedStatCol: {
    alignItems: 'center',
  },
  completedStatNum: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.ink,
  },
  completedStatLabel: {
    fontSize: 12,
    color: BrandColors.muted,
    marginTop: 2,
  },
  completedStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: BrandColors.border,
  },
  // Permission Dialog
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  dialogIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.muted,
    textAlign: 'center',
    marginBottom: 16,
  },
  dialogRememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BrandColors.border,
    marginBottom: 20,
  },
  dialogRememberText: {
    fontSize: 13,
    color: BrandColors.ink,
    fontWeight: '500',
    flex: 1,
    paddingRight: 10,
  },
  dialogActions: {
    width: '100%',
    gap: 10,
  },
  dialogButtonDestructive: {
    height: 50,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonDestructiveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dialogButtonNeutral: {
    height: 50,
    backgroundColor: '#EAE7DF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonNeutralText: {
    color: BrandColors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  dialogButtonCancel: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonCancelText: {
    color: BrandColors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  // Inspect Modal
  inspectBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  inspectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inspectTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 16,
  },
  inspectCloseBtn: {
    padding: 8,
  },
  inspectActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inspectShareBtn: {
    padding: 8,
    borderRadius: 8,
  },
  inspectImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectFullImage: {
    width: '100%',
    height: '100%',
  },
  inspectFooter: {
    backgroundColor: 'rgba(20, 24, 31, 0.85)',
    padding: 18,
  },
  inspectOcrText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
  },
});
