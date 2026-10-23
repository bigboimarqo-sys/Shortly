import { Image } from 'expo-image';
import {
  Check,
  Copy,
  EditPencil,
  Plus,
  ShareAndroid,
  Trash,
  Xmark,
} from 'iconoir-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import {
  ScreenshotCategory,
  ScreenshotItem,
  useScreenshots,
} from '@/hooks/use-screenshots';

interface ScreenshotDetailModalProps {
  screenshot: ScreenshotItem | null;
  visible: boolean;
  onClose: () => void;
}

const ALL_CATEGORIES: ScreenshotCategory[] = [
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
  'Other',
];

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

export function ScreenshotDetailModal({
  screenshot,
  visible,
  onClose,
}: ScreenshotDetailModalProps) {
  const {
    updateScreenshotCategory,
    addScreenshotTag,
    deleteScreenshot,
    customCollections,
  } = useScreenshots();

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  if (!screenshot) return null;

  const colorScheme =
    CATEGORY_COLORS[screenshot.category] || CATEGORY_COLORS.Other;

  const handleShare = async () => {
    try {
      await Share.share({
        title: screenshot.filename,
        message: `${screenshot.filename}\nCategory: ${screenshot.category}\n\nOCR Text:\n${screenshot.ocrText}`,
        url: screenshot.uri,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleCopyOcr = () => {
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const handleSelectCategory = (cat: ScreenshotCategory) => {
    updateScreenshotCategory(screenshot.id, cat);
    setShowCategoryPicker(false);
  };

  const handleAddTagSubmit = () => {
    if (tagInput.trim()) {
      addScreenshotTag(screenshot.id, tagInput.trim());
      setTagInput('');
      setShowAddTag(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Screenshot',
      `Are you sure you want to delete "${screenshot.filename}" from Shotly?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScreenshot(screenshot.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleAddToCollection = (colName: string) => {
    addScreenshotTag(screenshot.id, colName.toLowerCase());
    setShowCollectionPicker(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header matching Screenshot detail.png */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onClose}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share screenshot"
            onPress={handleShare}
            style={({ pressed }) => [styles.headerButton, pressed && { opacity: 0.6 }]}>
            <Text style={styles.shareButtonText}>Share</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            {/* Big Screenshot Preview Card */}
            <View style={styles.imageCard}>
              <Image
                source={{ uri: screenshot.uri }}
                style={styles.image}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
              />
            </View>

            {/* Category and Tags Row */}
            <View style={styles.pillRow}>
              {/* Category Pill with Edit Icon */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Category ${screenshot.category}. Tap to change.`}
                onPress={() => setShowCategoryPicker(true)}
                style={({ pressed }) => [
                  styles.categoryPill,
                  { backgroundColor: colorScheme.bg, borderColor: colorScheme.border },
                  pressed && { opacity: 0.8 },
                ]}>
                <Text style={[styles.categoryPillText, { color: colorScheme.text }]}>
                  {screenshot.category}
                </Text>
                <EditPencil color={colorScheme.text} width={13} height={13} strokeWidth={2} />
              </Pressable>

              {/* Tags */}
              {screenshot.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{tag}</Text>
                </View>
              ))}

              {/* Add Tag Pill */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add tag"
                onPress={() => setShowAddTag(!showAddTag)}
                style={({ pressed }) => [
                  styles.addTagPill,
                  pressed && { opacity: 0.8 },
                ]}>
                <Plus color={BrandColors.ink} width={12} height={12} strokeWidth={2} />
                <Text style={styles.addTagPillText}>Add tag</Text>
              </Pressable>
            </View>

            {/* Tag Input if active */}
            {showAddTag && (
              <View style={styles.addTagInputRow}>
                <TextInput
                  style={styles.addTagInput}
                  placeholder="Enter tag (e.g. dinner, 2026, tax)"
                  placeholderTextColor={BrandColors.muted}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTagSubmit}
                  returnKeyType="done"
                  autoFocus
                />
                <Pressable onPress={handleAddTagSubmit} style={styles.addTagSubmitBtn}>
                  <Check color="#FFFFFF" width={16} height={16} strokeWidth={2.4} />
                </Pressable>
              </View>
            )}

            {/* Text Found in Image Card matching Screenshot detail.png */}
            <View style={styles.ocrCard}>
              <View style={styles.ocrCardHeader}>
                <Text style={styles.ocrCardTitle}>Text found in image</Text>
                <Pressable
                  onPress={handleCopyOcr}
                  style={({ pressed }) => [
                    styles.copyOcrBtn,
                    pressed && { opacity: 0.7 },
                  ]}>
                  {copiedOcr ? (
                    <Text style={styles.copiedText}>Copied!</Text>
                  ) : (
                    <>
                      <Copy color={BrandColors.primary} width={14} height={14} strokeWidth={2} />
                      <Text style={styles.copyBtnText}>Copy</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <Text style={styles.ocrCardText}>
                {screenshot.ocrText || 'No text detected in this image.'}
              </Text>
            </View>

            {/* Bottom Actions matching Screenshot detail.png */}
            <View style={styles.buttonSection}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add to Collection"
                onPress={() => setShowCollectionPicker(true)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.primaryButtonText}>Add to Collection</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete screenshot"
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Category Picker Modal */}
        {showCategoryPicker && (
          <Modal
            transparent
            animationType="fade"
            visible={showCategoryPicker}
            onRequestClose={() => setShowCategoryPicker(false)}>
            <View style={styles.pickerBackdrop}>
              <View style={styles.pickerCard}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select Category</Text>
                  <Pressable onPress={() => setShowCategoryPicker(false)}>
                    <Xmark color={BrandColors.muted} width={20} height={20} strokeWidth={2} />
                  </Pressable>
                </View>
                <ScrollView style={styles.pickerScroll}>
                  {ALL_CATEGORIES.map((cat) => {
                    const isCurrent = screenshot.category === cat;
                    const catColors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => handleSelectCategory(cat)}
                        style={({ pressed }) => [
                          styles.pickerRow,
                          isCurrent && styles.pickerRowSelected,
                          pressed && { opacity: 0.7 },
                        ]}>
                        <View
                          style={[
                            styles.pickerRowDot,
                            { backgroundColor: catColors.text },
                          ]}
                        />
                        <Text
                          style={[
                            styles.pickerRowText,
                            isCurrent && styles.pickerRowTextSelected,
                          ]}>
                          {cat}
                        </Text>
                        {isCurrent && (
                          <Check color={BrandColors.primary} width={18} height={18} strokeWidth={2.4} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Collection Picker Modal */}
        {showCollectionPicker && (
          <Modal
            transparent
            animationType="fade"
            visible={showCollectionPicker}
            onRequestClose={() => setShowCollectionPicker(false)}>
            <View style={styles.pickerBackdrop}>
              <View style={styles.pickerCard}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Add to Collection</Text>
                  <Pressable onPress={() => setShowCollectionPicker(false)}>
                    <Xmark color={BrandColors.muted} width={20} height={20} strokeWidth={2} />
                  </Pressable>
                </View>
                <ScrollView style={styles.pickerScroll}>
                  {customCollections.map((col) => (
                    <Pressable
                      key={col}
                      onPress={() => handleAddToCollection(col)}
                      style={({ pressed }) => [
                        styles.pickerRow,
                        pressed && { opacity: 0.7 },
                      ]}>
                      <Text style={styles.pickerRowText}>{col}</Text>
                      <Plus color={BrandColors.primary} width={18} height={18} strokeWidth={2} />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
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
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  imageCard: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: '#EAE7DF',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  tagPillText: {
    fontSize: 13,
    color: BrandColors.muted,
    fontWeight: '600',
  },
  addTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EAE7DF',
  },
  addTagPillText: {
    fontSize: 13,
    color: BrandColors.ink,
    fontWeight: '600',
  },
  addTagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColors.border,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: BrandColors.ink,
  },
  addTagSubmitBtn: {
    backgroundColor: BrandColors.primary,
    borderRadius: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ocrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginBottom: 28,
  },
  ocrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ocrCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  copyOcrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  copiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  ocrCardText: {
    fontSize: 14,
    lineHeight: 22,
    color: BrandColors.muted,
  },
  buttonSection: {
    gap: 12,
  },
  primaryButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    height: 54,
    backgroundColor: '#EAE7DF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: 460,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  pickerScroll: {
    maxHeight: 340,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerRowSelected: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
  },
  pickerRowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  pickerRowText: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.ink,
    flex: 1,
  },
  pickerRowTextSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
});
