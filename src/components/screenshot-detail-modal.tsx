import { Image } from 'expo-image';
import {
  Check,
  Copy,
  EditPencil,
  Plus,
  Send,
  ShareAndroid,
  Sparks,
  Trash,
  Xmark,
} from 'iconoir-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AIService, SmartAction } from '@/services/ai-service';
import { shareScreenshotImage } from '@/services/share-service';

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
  const [isSharing, setIsSharing] = useState(false);

  // AI Assist States
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const aiInsight = useMemo(() => {
    if (!screenshot) return null;
    return AIService.analyzeScreenshot(
      screenshot.ocrText || '',
      screenshot.category,
      screenshot.filename
    );
  }, [screenshot?.ocrText, screenshot?.category, screenshot?.filename]);

  const handleSmartAction = async (action: SmartAction) => {
    if (action.actionType === 'open_url') {
      try {
        await Linking.openURL(action.value);
      } catch (e) {
        Alert.alert('Link', action.value);
      }
    } else if (action.actionType === 'call') {
      try {
        await Linking.openURL(`tel:${action.value}`);
      } catch (e) {
        setActionFeedback(`Copied ${action.value}`);
        setTimeout(() => setActionFeedback(null), 2000);
      }
    } else {
      setActionFeedback(`Copied: ${action.value}`);
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  const handleAskAi = (questionText?: string) => {
    const q = (questionText || aiQuestion).trim();
    if (!q || !screenshot) return;
    const answer = AIService.askScreenshot(
      q,
      screenshot.ocrText || '',
      screenshot.category
    );
    setAiAnswer(answer);
  };

  if (!screenshot) return null;

  const colorScheme =
    CATEGORY_COLORS[screenshot.category] || CATEGORY_COLORS.Other;

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await shareScreenshotImage(screenshot.uri, screenshot.filename);
    } finally {
      setIsSharing(false);
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
            accessibilityLabel="Share screenshot image"
            onPress={handleShare}
            disabled={isSharing}
            style={({ pressed }) => [
              styles.headerButton,
              styles.shareHeaderButton,
              pressed && { opacity: 0.6 },
              isSharing && { opacity: 0.5 },
            ]}>
            <ShareAndroid color={BrandColors.primary} width={18} height={18} strokeWidth={2.4} />
            <Text style={styles.shareButtonText}>{isSharing ? 'Sharing...' : 'Share'}</Text>
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

            {/* AI Assist Card */}
            {aiInsight && (
              <View style={styles.aiCard}>
                <View style={styles.aiCardHeader}>
                  <View style={styles.aiTitleRow}>
                    <Sparks color={BrandColors.primary} width={18} height={18} strokeWidth={2.5} />
                    <Text style={styles.aiCardTitle}>Marcus · AI Assist</Text>
                  </View>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>⚡ On-Device & Private</Text>
                  </View>
                </View>

                {/* AI Summary */}
                <Text style={styles.aiSummaryText}>{aiInsight.summary}</Text>

                {/* Toast Feedback for Actions */}
                {actionFeedback && (
                  <View style={styles.actionFeedbackBox}>
                    <Check color="#15803D" width={14} height={14} strokeWidth={3} />
                    <Text style={styles.actionFeedbackText}>{actionFeedback}</Text>
                  </View>
                )}

                {/* Smart Actions (if detected) */}
                {aiInsight.smartActions.length > 0 && (
                  <View style={styles.actionsSection}>
                    <Text style={styles.aiSubheader}>Smart Actions</Text>
                    <View style={styles.actionsRow}>
                      {aiInsight.smartActions.map((act) => (
                        <Pressable
                          key={act.id}
                          onPress={() => handleSmartAction(act)}
                          style={({ pressed }) => [
                            styles.smartActionChip,
                            pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                          ]}>
                          <Text style={styles.smartActionIcon}>{act.icon}</Text>
                          <Text style={styles.smartActionLabel}>{act.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suggested AI Tags */}
                {aiInsight.suggestedTags.length > 0 && (
                  <View style={styles.suggestedTagsSection}>
                    <Text style={styles.aiSubheader}>Add AI Tags</Text>
                    <View style={styles.suggestedTagsRow}>
                      {aiInsight.suggestedTags.map((tag) => (
                        <Pressable
                          key={`ai-tag-${tag}`}
                          onPress={() => addScreenshotTag(screenshot.id, tag.toLowerCase())}
                          style={({ pressed }) => [
                            styles.suggestedTagChip,
                            pressed && { opacity: 0.7 },
                          ]}>
                          <Plus color={BrandColors.primary} width={12} height={12} strokeWidth={2.4} />
                          <Text style={styles.suggestedTagText}>#{tag}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {/* Ask AI about this Screenshot */}
                <View style={styles.askAiSection}>
                  <Text style={styles.aiSubheader}>Ask Marcus about this screenshot</Text>

                  {/* Quick question pills */}
                  <View style={styles.quickQuestionsRow}>
                    <Pressable
                      onPress={() => handleAskAi('What was the total or price?')}
                      style={styles.quickQuestionChip}>
                      <Text style={styles.quickQuestionText}>What's the total?</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleAskAi('What is the code or OTP?')}
                      style={styles.quickQuestionChip}>
                      <Text style={styles.quickQuestionText}>What's the code?</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleAskAi('When was this?')}
                      style={styles.quickQuestionChip}>
                      <Text style={styles.quickQuestionText}>When was this?</Text>
                    </Pressable>
                  </View>

                  {/* Ask Question Input */}
                  <View style={styles.askInputRow}>
                    <TextInput
                      style={styles.askInput}
                      placeholder="Ask Marcus anything about this image..."
                      placeholderTextColor={BrandColors.muted}
                      value={aiQuestion}
                      onChangeText={setAiQuestion}
                      onSubmitEditing={() => handleAskAi()}
                      returnKeyType="send"
                    />
                    <Pressable
                      disabled={!aiQuestion.trim()}
                      onPress={() => handleAskAi()}
                      style={({ pressed }) => [
                        styles.askSubmitBtn,
                        !aiQuestion.trim() && styles.askSubmitBtnDisabled,
                        pressed && { opacity: 0.8 },
                      ]}>
                      <Send color="#FFFFFF" width={14} height={14} strokeWidth={2.4} />
                    </Pressable>
                  </View>

                  {/* AI Inline Answer */}
                  {aiAnswer && (
                    <View style={styles.aiAnswerBox}>
                      <View style={styles.aiAnswerHeader}>
                        <Sparks color={BrandColors.primary} width={14} height={14} strokeWidth={2.5} />
                        <Text style={styles.aiAnswerTitle}>Marcus Answer</Text>
                      </View>
                      <Text style={styles.aiAnswerText}>{aiAnswer}</Text>
                    </View>
                  )}
                </View>
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

            {/* Bottom Actions */}
            <View style={styles.buttonSection}>
              {/* Primary Action: Share Screenshot as Image */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share screenshot image"
                onPress={handleShare}
                disabled={isSharing}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  isSharing && { opacity: 0.6 },
                ]}>
                <View style={styles.buttonIconRow}>
                  <ShareAndroid color="#FFFFFF" width={20} height={20} strokeWidth={2.4} />
                  <Text style={styles.primaryButtonText}>
                    {isSharing ? 'Sharing Image...' : 'Share Screenshot Image'}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add to Collection"
                onPress={() => setShowCollectionPicker(true)}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.secondaryButtonText}>Add to Collection</Text>
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
  shareHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  buttonIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: BrandColors.ink,
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
  // AI Assist Styles
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E2EE',
    marginBottom: 20,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  aiBadge: {
    backgroundColor: '#EBF2FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  aiSummaryText: {
    fontSize: 14,
    lineHeight: 21,
    color: BrandColors.ink,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
  },
  aiSubheader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: BrandColors.muted,
    marginBottom: 8,
  },
  actionFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionFeedbackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  actionsSection: {
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smartActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  smartActionIcon: {
    fontSize: 14,
  },
  smartActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  suggestedTagsSection: {
    marginBottom: 14,
  },
  suggestedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  suggestedTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  askAiSection: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  quickQuestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  quickQuestionChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  quickQuestionText: {
    fontSize: 12,
    color: BrandColors.primary,
    fontWeight: '600',
  },
  askInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  askInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: BrandColors.ink,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  askSubmitBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askSubmitBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  aiAnswerBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 6,
  },
  aiAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiAnswerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  aiAnswerText: {
    fontSize: 13,
    lineHeight: 19,
    color: BrandColors.ink,
  },
});
