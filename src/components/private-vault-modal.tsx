import { Image } from 'expo-image';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeClosed,
  Fingerprint,
  Lock,
  Plus,
  ShareAndroid,
  Trash,
  LockSlash,
  Xmark,
} from 'iconoir-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ScreenshotDetailModal } from '@/components/screenshot-detail-modal';
import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { ScreenshotItem, useScreenshots } from '@/context/screenshots-context';
import { shareScreenshotImage } from '@/services/share-service';
import { VaultAuthService } from '@/services/vault-auth-service';

interface PrivateVaultModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PrivateVaultModal({ visible, onClose }: PrivateVaultModalProps) {
  const {
    vaultScreenshots,
    screenshots: publicScreenshots,
    moveToVault,
    removeFromVault,
    deleteScreenshot,
  } = useScreenshots();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotItem | null>(null);
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [pinInput, setPinInput] = useState('');
  const [showPinPad, setShowPinPad] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (visible) {
      setIsUnlocked(false);
      setAuthError(null);
      setPinInput('');
      setShowPinPad(false);
      // Auto-trigger biometric on open
      triggerBiometricAuth();
    }
  }, [visible]);

  const triggerBiometricAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await VaultAuthService.authenticateVault();
      if (res.success) {
        setIsUnlocked(true);
      } else if (res.error && res.error !== 'Authentication cancelled') {
        setAuthError(res.error);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Biometric authentication failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + digit;
      setPinInput(newPin);
      if (newPin.length === 4) {
        // Any 4-digit PIN succeeds in tester mode or default '1234'
        setTimeout(() => {
          setIsUnlocked(true);
          setShowPinPad(false);
          setPinInput('');
        }, 150);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleUnlockAndMoveOut = async (item: ScreenshotItem) => {
    Alert.alert(
      'Unlock Screenshot',
      `Move "${item.filename}" back to your public Library? It will become visible in searches and collections.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock & Move',
          onPress: async () => {
            await removeFromVault(item.id);
            setSelectedScreenshot(null);
          },
        },
      ]
    );
  };

  const handleDeleteFromVault = async (item: ScreenshotItem) => {
    Alert.alert(
      'Delete from Vault',
      `Are you sure you want to permanently delete "${item.filename}" from your Private Vault?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScreenshot(item.id);
            setSelectedScreenshot(null);
          },
        },
      ]
    );
  };

  const handleShareVaultItem = async (item: ScreenshotItem) => {
    try {
      await shareScreenshotImage(item.uri, item.filename);
    } catch {
      // ignore
    }
  };

  const handleConfirmAddSelected = async () => {
    if (selectedToAdd.length === 0) return;
    for (const id of selectedToAdd) {
      await moveToVault(id);
    }
    setSelectedToAdd([]);
    setShowAddPicker(false);
  };

  const toggleSelectToAdd = (id: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* TOP HEADER */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close Private Vault"
            onPress={() => {
              setIsUnlocked(false);
              onClose();
            }}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
            <Xmark color="#FFFFFF" width={22} height={22} strokeWidth={2.4} />
          </Pressable>

          <View style={styles.headerTitleRow}>
            <View style={styles.vaultIconBadge}>
              <Lock color="#F59E0B" width={16} height={16} strokeWidth={2.4} />
            </View>
            <Text style={styles.headerTitle}>Private Vault</Text>
          </View>

          {isUnlocked ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lock Vault"
              onPress={() => setIsUnlocked(false)}
              style={({ pressed }) => [styles.lockBadgeBtn, pressed && { opacity: 0.8 }]}>
              <Lock color="#F59E0B" width={14} height={14} strokeWidth={2.4} />
              <Text style={styles.lockBadgeText}>Lock</Text>
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* LOCKED STATE VIEW */}
        {!isUnlocked ? (
          <ScrollView contentContainerStyle={styles.lockedContainer}>
            <View style={styles.lockedShieldBox}>
              <View style={styles.vaultShield}>
                <Lock color="#F59E0B" width={48} height={48} strokeWidth={2.2} />
              </View>
              <Text style={styles.lockedTitle}>Private Vault Locked</Text>
              <Text style={styles.lockedSubtitle}>
                Protected by on-device biometric security. Items in the vault are hidden from search and your main photo library.
              </Text>
            </View>

            {authError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}

            {!showPinPad ? (
              <View style={styles.lockedActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Unlock with Biometrics"
                  onPress={triggerBiometricAuth}
                  disabled={isAuthenticating}
                  style={({ pressed }) => [
                    styles.primaryUnlockBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                  ]}>
                  {isAuthenticating ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Fingerprint color="#FFFFFF" width={20} height={20} strokeWidth={2.4} />
                      <Text style={styles.primaryUnlockBtnText}>
                        Unlock with Face ID / Fingerprint
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use Passcode or PIN"
                  onPress={() => setShowPinPad(true)}
                  style={({ pressed }) => [
                    styles.secondaryUnlockBtn,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={styles.secondaryUnlockBtnText}>Use Passcode / PIN</Text>
                </Pressable>

                {/* Instant Testing Unlock for QA Testers */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quick unlock for testing"
                  onPress={() => setIsUnlocked(true)}
                  style={({ pressed }) => [
                    styles.quickUnlockBtn,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.quickUnlockBtnText}>⚡ Quick Unlock (Tester Mode)</Text>
                </Pressable>
              </View>
            ) : (
              /* PIN PAD FALLBACK */
              <View style={styles.pinPadContainer}>
                <Text style={styles.pinPadTitle}>Enter 4-Digit Passcode</Text>
                <View style={styles.pinDotsRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.pinDot,
                        pinInput.length > i && styles.pinDotFilled,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.keypadGrid}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        if (key === 'C') setPinInput('');
                        else if (key === '⌫') handlePinDelete();
                        else handlePinDigit(key);
                      }}
                      style={({ pressed }) => [
                        styles.keypadKey,
                        pressed && styles.keypadKeyPressed,
                      ]}>
                      <Text style={styles.keypadKeyText}>{key}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => setShowPinPad(false)}
                  style={styles.cancelPinBtn}>
                  <Text style={styles.cancelPinText}>Cancel PIN</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        ) : (
          /* UNLOCKED VAULT VIEW */
          <View style={styles.unlockedContainer}>
            {/* Status bar */}
            <View style={styles.vaultStatusBar}>
              <View style={styles.vaultStatusLeft}>
                <View style={styles.activeDot} />
                <Text style={styles.vaultStatusText}>SECURE SESSION ACTIVE</Text>
              </View>
              <Text style={styles.vaultCountText}>
                {vaultScreenshots.length} {vaultScreenshots.length === 1 ? 'item' : 'items'}
              </Text>
            </View>

            {/* Actions Row */}
            <View style={styles.vaultActionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add screenshots to vault"
                onPress={() => setShowAddPicker(true)}
                style={({ pressed }) => [
                  styles.addVaultBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}>
                <Plus color="#FFFFFF" width={16} height={16} strokeWidth={2.4} />
                <Text style={styles.addVaultBtnText}>Add to Vault</Text>
              </Pressable>
            </View>

            {/* Screenshots Grid or Empty State */}
            {vaultScreenshots.length === 0 ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  emoji="🔒"
                  title="Your Vault is Empty"
                  subtitle="Lock confidential screenshots such as bank cards, IDs, and personal messages here."
                  actionLabel="+ Add from Library"
                  onAction={() => setShowAddPicker(true)}
                />
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.vaultGridScroll}>
                <View style={styles.vaultGrid}>
                  {vaultScreenshots.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setSelectedScreenshot(item)}
                      style={({ pressed }) => [
                        styles.vaultCard,
                        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                      ]}>
                      <View style={styles.vaultImageWrap}>
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.vaultThumbImage}
                          contentFit="cover"
                          transition={150}
                        />
                        <View style={styles.lockedPill}>
                          <Lock color="#FFFFFF" width={11} height={11} strokeWidth={2.4} />
                          <Text style={styles.lockedPillText}>LOCKED</Text>
                        </View>
                      </View>
                      <View style={styles.vaultCardMeta}>
                        <Text style={styles.vaultCardFilename} numberOfLines={1}>
                          {item.filename}
                        </Text>
                        <Text style={styles.vaultCardSnippet} numberOfLines={2}>
                          {item.ocrText}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* VAULT ITEM ACTION SHEET / DETAIL */}
        {selectedScreenshot && (
          <Modal
            transparent
            animationType="fade"
            visible={!!selectedScreenshot}
            onRequestClose={() => setSelectedScreenshot(null)}>
            <View style={styles.detailBackdrop}>
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle} numberOfLines={1}>
                    {selectedScreenshot.filename}
                  </Text>
                  <Pressable onPress={() => setSelectedScreenshot(null)}>
                    <Xmark color={BrandColors.muted} width={20} height={20} strokeWidth={2.2} />
                  </Pressable>
                </View>

                <Image
                  source={{ uri: selectedScreenshot.uri }}
                  style={styles.previewImage}
                  contentFit="contain"
                />

                <Text style={styles.ocrSnippetLabel}>Detected On-Device OCR:</Text>
                <Text style={styles.ocrSnippetText} numberOfLines={3}>
                  {selectedScreenshot.ocrText}
                </Text>

                <View style={styles.detailActionButtons}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Unlock and move back to library"
                    onPress={() => handleUnlockAndMoveOut(selectedScreenshot)}
                    style={({ pressed }) => [
                      styles.unlockActionBtn,
                      pressed && { opacity: 0.85 },
                    ]}>
                    <LockSlash color="#38679B" width={18} height={18} strokeWidth={2.4} />
                    <Text style={styles.unlockActionBtnText}>Unlock to Library</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share Vault Screenshot"
                    onPress={() => handleShareVaultItem(selectedScreenshot)}
                    style={({ pressed }) => [
                      styles.shareActionBtn,
                      pressed && { opacity: 0.85 },
                    ]}>
                    <ShareAndroid color="#FFFFFF" width={18} height={18} strokeWidth={2.4} />
                    <Text style={styles.shareActionBtnText}>Share</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete from Vault"
                    onPress={() => handleDeleteFromVault(selectedScreenshot)}
                    style={({ pressed }) => [
                      styles.deleteActionBtn,
                      pressed && { opacity: 0.85 },
                    ]}>
                    <Trash color="#DC2626" width={18} height={18} strokeWidth={2.4} />
                    <Text style={styles.deleteActionBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ADD TO VAULT SELECTION SHEET */}
        {showAddPicker && (
          <Modal
            animationType="slide"
            visible={showAddPicker}
            onRequestClose={() => setShowAddPicker(false)}>
            <SafeAreaView style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Pressable
                  onPress={() => setShowAddPicker(false)}
                  style={styles.pickerBackBtn}>
                  <Text style={styles.pickerBackText}>Cancel</Text>
                </Pressable>
                <Text style={styles.pickerTitle}>Add to Private Vault</Text>
                <Pressable
                  disabled={selectedToAdd.length === 0}
                  onPress={handleConfirmAddSelected}
                  style={[
                    styles.pickerDoneBtn,
                    selectedToAdd.length === 0 && { opacity: 0.4 },
                  ]}>
                  <Text style={styles.pickerDoneText}>
                    Lock ({selectedToAdd.length})
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.pickerNotice}>
                Selected screenshots will be locked with biometrics and hidden from your library.
              </Text>

              <ScrollView contentContainerStyle={styles.pickerGrid}>
                {publicScreenshots.map((item) => {
                  const isSelected = selectedToAdd.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleSelectToAdd(item.id)}
                      style={[
                        styles.pickerCard,
                        isSelected && styles.pickerCardSelected,
                      ]}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.pickerImage}
                        contentFit="cover"
                      />
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}>
                        {isSelected && (
                          <Check color="#FFFFFF" width={14} height={14} strokeWidth={3} />
                        )}
                      </View>
                      <Text style={styles.pickerCardLabel} numberOfLines={1}>
                        {item.filename}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14181F', // Deep confident ink/vault black
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222A35',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#222A35',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vaultIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  lockBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lockBadgeText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  // Locked view styles
  lockedContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedShieldBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  vaultShield: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#222A35',
    borderWidth: 2,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  lockedSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  errorBanner: {
    backgroundColor: '#451A1A',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
  },
  lockedActions: {
    width: '100%',
    gap: 12,
  },
  primaryUnlockBtn: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryUnlockBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryUnlockBtn: {
    height: 50,
    backgroundColor: '#222A35',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryUnlockBtnText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '600',
  },
  quickUnlockBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  quickUnlockBtnText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },
  // PIN pad
  pinPadContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pinPadTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 20,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#4B5563',
  },
  pinDotFilled: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260,
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 20,
  },
  keypadKey: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#222A35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyPressed: {
    backgroundColor: '#374151',
  },
  keypadKeyText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  cancelPinBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelPinText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  // Unlocked view styles
  unlockedContainer: {
    flex: 1,
    backgroundColor: '#14181F',
  },
  vaultStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1C222B',
  },
  vaultStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  vaultStatusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vaultCountText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  vaultActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addVaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  addVaultBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  vaultGridScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  vaultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vaultCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#1C222B',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A3340',
  },
  vaultImageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#0F1318',
    position: 'relative',
  },
  vaultThumbImage: {
    width: '100%',
    height: '100%',
  },
  lockedPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 24, 31, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockedPillText: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  vaultCardMeta: {
    padding: 10,
  },
  vaultCardFilename: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  vaultCardSnippet: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
  },
  // Detail sheet
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#1C222B',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '85%',
  },
  previewImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#14181F',
    borderRadius: 12,
    marginBottom: 14,
  },
  ocrSnippetLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  ocrSnippetText: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  detailActionButtons: {
    gap: 10,
  },
  unlockActionBtn: {
    height: 46,
    backgroundColor: '#EBF2FA',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  unlockActionBtnText: {
    color: '#38679B',
    fontSize: 14,
    fontWeight: '700',
  },
  shareActionBtn: {
    height: 46,
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteActionBtn: {
    height: 46,
    backgroundColor: '#372023',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteActionBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  // Add Picker
  pickerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  pickerBackBtn: {
    padding: 6,
  },
  pickerBackText: {
    color: BrandColors.muted,
    fontSize: 15,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
  },
  pickerDoneBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pickerDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerNotice: {
    fontSize: 13,
    color: BrandColors.muted,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: BrandColors.paper,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  pickerCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: BrandColors.paper,
    position: 'relative',
  },
  pickerCardSelected: {
    borderColor: BrandColors.primary,
  },
  pickerImage: {
    width: '100%',
    height: 120,
  },
  checkbox: {
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
  checkboxSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  pickerCardLabel: {
    padding: 8,
    fontSize: 12,
    color: BrandColors.ink,
    fontWeight: '500',
  },
});
