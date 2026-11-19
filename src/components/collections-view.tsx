import { Image } from 'expo-image';
import { Check, Folder, Lock, NavArrowRight, Plus, Xmark } from 'iconoir-react-native';
import { useMemo, useState } from 'react';
import {
  Dimensions,
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

import { BottomTabBar, TabName } from '@/components/bottom-tab-bar';
import { EmptyState } from '@/components/empty-state';
import { PaywallModal } from '@/components/paywall-modal';
import { PrivateVaultModal } from '@/components/private-vault-modal';
import { ScreenshotDetailModal } from '@/components/screenshot-detail-modal';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useSubscription } from '@/context/subscription-context';
import { ScreenshotItem, useScreenshots } from '@/hooks/use-screenshots';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CollectionsViewProps {
  onTabChange?: (tab: TabName) => void;
  onNewCollection?: () => void;
}

export function CollectionsView({ onTabChange }: CollectionsViewProps) {
  const {
    screenshots,
    vaultScreenshots,
    customCollections,
    createCustomCollection,
    addScreenshotsToCollection,
  } = useScreenshots();
  const { isPlus } = useSubscription();
  const { requireAuth } = useAuth();

  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionSubFilter, setCollectionSubFilter] = useState<'All' | 'Newest' | 'Tagged'>('All');
  const [inspectScreenshot, setInspectScreenshot] = useState<ScreenshotItem | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showAddScreenshotsModal, setShowAddScreenshotsModal] = useState(false);
  const [selectedScreenshotsToAdd, setSelectedScreenshotsToAdd] = useState<string[]>([]);

  // Group screenshots by collection / category
  const collectionsData = useMemo(() => {
    return customCollections.map((colName) => {
      const items = screenshots.filter(
        (s) =>
          s.category.toLowerCase() === colName.toLowerCase() ||
          s.tags.some((t) => t.toLowerCase() === colName.toLowerCase())
      );
      return {
        name: colName,
        count: items.length,
        items,
        coverUri: items[0]?.uri || null,
        secondaryCoverUri: items[1]?.uri || null,
      };
    });
  }, [screenshots, customCollections]);

  // Filtered items when inside a Collection Detail view
  const activeCollectionItems = useMemo(() => {
    if (!selectedCollection) return [];
    let items = screenshots.filter(
      (s) =>
        s.category.toLowerCase() === selectedCollection.toLowerCase() ||
        s.tags.some((t) => t.toLowerCase() === selectedCollection.toLowerCase())
    );

    if (collectionSubFilter === 'Newest') {
      items = [...items].sort((a, b) => b.creationTime - a.creationTime);
    } else if (collectionSubFilter === 'Tagged') {
      items = items.filter((s) => s.tags.length > 0);
    }
    return items;
  }, [screenshots, selectedCollection, collectionSubFilter]);

  const handleCreateCollection = async () => {
    const clean = newCollectionName.trim();
    if (!clean) return;

    if (!isPlus && customCollections.length >= 3) {
      setShowNewCollectionModal(false);
      setShowPaywall(true);
      return;
    }

    await createCustomCollection(clean);
    setNewCollectionName('');
    setShowNewCollectionModal(false);
  };

  const handleToggleSelectToAdd = (id: string) => {
    setSelectedScreenshotsToAdd((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirmAddScreenshots = async () => {
    if (!selectedCollection || selectedScreenshotsToAdd.length === 0) return;
    await addScreenshotsToCollection(selectedScreenshotsToAdd, selectedCollection);
    setSelectedScreenshotsToAdd([]);
    setShowAddScreenshotsModal(false);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {selectedCollection ? (
        /* 1. Collection Detail View matching Collection detail.png */
        <View style={styles.detailWrapper}>
          <View style={styles.detailHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to Collections"
              onPress={() => setSelectedCollection(null)}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailScrollContent}>
            <View style={styles.mainContainer}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailTitle}>{selectedCollection}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add screenshots to this collection"
                  onPress={() => {
                    setSelectedScreenshotsToAdd([]);
                    setShowAddScreenshotsModal(true);
                  }}
                  style={({ pressed }) => [
                    styles.addPhotosToColBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}>
                  <Plus color="#FFFFFF" width={14} height={14} strokeWidth={2.4} />
                  <Text style={styles.addPhotosToColBtnText}>Add Screenshots</Text>
                </Pressable>
              </View>

              {/* Sub-filter Pills matching Collection detail.png */}
              <View style={styles.subFilterRow}>
                {(['All', 'Newest', 'Tagged'] as const).map((filter) => {
                  const isSelected = collectionSubFilter === filter;
                  return (
                    <Pressable
                      key={filter}
                      onPress={() => setCollectionSubFilter(filter)}
                      style={[
                        styles.subFilterPill,
                        isSelected
                          ? styles.subFilterPillActive
                          : styles.subFilterPillInactive,
                      ]}>
                      <Text
                        style={[
                          styles.subFilterText,
                          isSelected
                            ? styles.subFilterTextActive
                            : styles.subFilterTextInactive,
                        ]}>
                        {filter}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 2-column Grid matching Collection detail.png */}
              {activeCollectionItems.length === 0 ? (
                <EmptyState
                  emoji="📂"
                  title="No screenshots in this collection"
                  subtitle={`Add screenshots from your library to "${selectedCollection}".`}
                  actionLabel="+ Add Screenshots"
                  onAction={() => {
                    setSelectedScreenshotsToAdd([]);
                    setShowAddScreenshotsModal(true);
                  }}
                />
              ) : (
                <View style={styles.detailGrid}>
                  {activeCollectionItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setInspectScreenshot(item)}
                      style={({ pressed }) => [
                        styles.detailGridItem,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.detailGridImage}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.detailItemMeta}>
                        <Text style={styles.detailItemFilename} numberOfLines={1}>
                          {item.filename}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* 2. Collections List View matching Collections.png with REAL IMAGES */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Collections</Text>
            </View>

            {/* Collections List with Visual Image Thumbnails */}
            <View style={styles.listContainer}>
              {/* Pinned Private Vault Card */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Private Vault"
                onPress={() => setShowVaultModal(true)}
                style={({ pressed }) => [
                  styles.vaultPinnedCard,
                  pressed && { opacity: 0.88, backgroundColor: '#1A232F' },
                ]}>
                <View style={styles.vaultThumbWrapper}>
                  <Lock color="#F59E0B" width={22} height={22} strokeWidth={2.4} />
                </View>
                <View style={styles.collectionInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.vaultCardTitle}>Private Vault</Text>
                    <View style={styles.vaultLockTag}>
                      <Text style={styles.vaultLockTagText}>BIOMETRIC</Text>
                    </View>
                  </View>
                  <Text style={styles.vaultCount}>
                    {vaultScreenshots.length > 0
                      ? `[${vaultScreenshots.length}] items locked`
                      : 'Locked · Hidden from search'}
                  </Text>
                </View>
                <NavArrowRight color="#F59E0B" width={20} height={20} strokeWidth={2} />
              </Pressable>

              {collectionsData.length === 0 ? (
                <EmptyState
                  emoji="📁"
                  title="No collections yet"
                  subtitle="Group receipts, recipes, or work screenshots into organized collections."
                  actionLabel="Create Collection"
                  onAction={() => {
                    if (!requireAuth('create custom collections')) return;
                    setShowNewCollectionModal(true);
                  }}
                />
              ) : (
                collectionsData.map((item) => (
                  <Pressable
                    key={item.name}
                    accessibilityRole="button"
                    accessibilityLabel={`Collection ${item.name}, ${item.count} items`}
                    onPress={() => {
                      setCollectionSubFilter('All');
                      setSelectedCollection(item.name);
                    }}
                    style={({ pressed }) => [
                      styles.collectionCard,
                      pressed && { opacity: 0.88, backgroundColor: '#F0EDE3' },
                    ]}>
                    {/* Visual Image Preview Thumbnail (Fixes: on collection part no image is showing) */}
                    <View style={styles.thumbWrapper}>
                      {item.coverUri ? (
                        <Image
                          source={{ uri: item.coverUri }}
                          style={styles.collectionThumbImage}
                          contentFit="cover"
                          transition={150}
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View style={styles.collectionThumbPlaceholder}>
                          <Folder color={BrandColors.muted} width={22} height={22} strokeWidth={2} />
                        </View>
                      )}
                    </View>

                    <View style={styles.collectionInfo}>
                      <Text style={styles.collectionName}>{item.name}</Text>
                      <Text style={styles.collectionCount}>[{item.count}] items</Text>
                    </View>

                    <NavArrowRight color={BrandColors.muted} width={20} height={20} strokeWidth={2} />
                  </Pressable>
                ))
              )}
            </View>

            {/* Free Plan Limit Notice matching Collections.png */}
            <Pressable
              onPress={() => {
                if (!requireAuth('manage subscriptions and trials')) return;
                setShowPaywall(true);
              }}>
              <Text style={styles.planNotice}>
                Free plan: up to 3 Collections{' '}
                <Text style={styles.planNoticeUpgrade}>Upgrade to Plus</Text>
              </Text>
            </Pressable>

            {/* New Collection Button matching Collections.png */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New Collection"
              onPress={() => {
                if (!requireAuth('create custom collections')) return;
                setShowNewCollectionModal(true);
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.primaryButtonText}>New Collection</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* New Collection Input Modal */}
      {showNewCollectionModal && (
        <Modal
          transparent
          animationType="fade"
          visible={showNewCollectionModal}
          onRequestClose={() => setShowNewCollectionModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>New Collection</Text>
                <Pressable onPress={() => setShowNewCollectionModal(false)}>
                  <Xmark color={BrandColors.muted} width={20} height={20} strokeWidth={2} />
                </Pressable>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Collection name (e.g. Travel, Memes, Tax)"
                placeholderTextColor={BrandColors.muted}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateCollection}
              />

              <View style={styles.modalButtonRow}>
                <Pressable
                  onPress={() => setShowNewCollectionModal(false)}
                  style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateCollection}
                  style={styles.modalCreateBtn}>
                  <Text style={styles.modalCreateText}>Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Screenshot Detail Inspector Modal */}
      {inspectScreenshot && (
        <ScreenshotDetailModal
          screenshot={inspectScreenshot}
          visible={!!inspectScreenshot}
          onClose={() => setInspectScreenshot(null)}
        />
      )}

      {/* Paywall Upgrade Modal */}
      {showPaywall && (
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* Add Screenshots to Collection Modal */}
      {showAddScreenshotsModal && selectedCollection && (
        <Modal
          animationType="slide"
          visible={showAddScreenshotsModal}
          onRequestClose={() => setShowAddScreenshotsModal(false)}>
          <SafeAreaView style={styles.addPickerContainer}>
            <View style={styles.addPickerHeader}>
              <Pressable
                onPress={() => setShowAddScreenshotsModal(false)}
                style={styles.addPickerBackBtn}>
                <Text style={styles.addPickerBackText}>Cancel</Text>
              </Pressable>
              <Text style={styles.addPickerTitle}>Add to {selectedCollection}</Text>
              <Pressable
                disabled={selectedScreenshotsToAdd.length === 0}
                onPress={handleConfirmAddScreenshots}
                style={[
                  styles.addPickerDoneBtn,
                  selectedScreenshotsToAdd.length === 0 && { opacity: 0.4 },
                ]}>
                <Text style={styles.addPickerDoneText}>
                  Add ({selectedScreenshotsToAdd.length})
                </Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.addPickerGrid}>
              {screenshots.map((item) => {
                const isSelected = selectedScreenshotsToAdd.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleToggleSelectToAdd(item.id)}
                    style={[
                      styles.addPickerCard,
                      isSelected && styles.addPickerCardSelected,
                    ]}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.addPickerImage}
                      contentFit="cover"
                    />
                    <View
                      style={[
                        styles.addCheckbox,
                        isSelected && styles.addCheckboxSelected,
                      ]}>
                      {isSelected && (
                        <Check color="#FFFFFF" width={14} height={14} strokeWidth={3} />
                      )}
                    </View>
                    <Text style={styles.addPickerCardLabel} numberOfLines={1}>
                      {item.filename}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Biometric Private Vault Modal */}
      <PrivateVaultModal
        visible={showVaultModal}
        onClose={() => setShowVaultModal(false)}
      />

      {/* Persistent Bottom Tab Bar */}
      <BottomTabBar
        activeTab="Collections"
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
  listContainer: {
    marginBottom: 20,
    gap: 8,
  },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    backgroundColor: 'transparent',
  },
  thumbWrapper: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#EAE7DF',
    marginRight: 16,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  collectionThumbImage: {
    width: '100%',
    height: '100%',
  },
  collectionThumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 3,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  collectionCount: {
    fontSize: 14,
    color: BrandColors.muted,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  planNotice: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.muted,
    marginBottom: 24,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  planNoticeUpgrade: {
    color: BrandColors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  detailWrapper: {
    flex: 1,
  },
  detailHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  detailScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  detailTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  subFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  subFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  subFilterPillActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  subFilterPillInactive: {
    backgroundColor: '#EAE7DF',
    borderColor: 'transparent',
  },
  subFilterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  subFilterTextActive: {
    color: '#FFFFFF',
  },
  subFilterTextInactive: {
    color: BrandColors.ink,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailGridItem: {
    width: '48%',
    aspectRatio: 0.85,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  detailGridImage: {
    width: '100%',
    height: '80%',
  },
  detailItemMeta: {
    height: '20%',
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  detailItemFilename: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  emptyDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginTop: 20,
  },
  emptyDetailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 6,
  },
  emptyDetailSubtitle: {
    fontSize: 13,
    color: BrandColors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: BrandColors.ink,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 15,
    color: BrandColors.muted,
    fontWeight: '600',
  },
  modalCreateBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCreateText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Detail Title Row & Add Photos Button
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addPhotosToColBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addPhotosToColBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Pinned Private Vault Card
  vaultPinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#14181F',
    borderWidth: 1,
    borderColor: '#263140',
    marginBottom: 10,
  },
  vaultThumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#222A35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  vaultCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  vaultLockTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vaultLockTagText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  vaultCount: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Add Picker Sheet styles
  addPickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  addPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  addPickerBackBtn: {
    padding: 6,
  },
  addPickerBackText: {
    color: BrandColors.muted,
    fontSize: 15,
  },
  addPickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  addPickerDoneBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addPickerDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  addPickerCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: BrandColors.paper,
    position: 'relative',
  },
  addPickerCardSelected: {
    borderColor: BrandColors.primary,
  },
  addPickerImage: {
    width: '100%',
    height: 120,
  },
  addCheckbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2,
    borderColor: BrandColors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCheckboxSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  addPickerCardLabel: {
    padding: 8,
    fontSize: 12,
    color: BrandColors.ink,
    fontWeight: '500',
  },
});
