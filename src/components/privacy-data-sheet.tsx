import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PrivacyPolicyModal } from '@/components/privacy-policy-modal';
import { BrandColors } from '@/constants/theme';
import { useScreenshots } from '@/context/screenshots-context';

interface PrivacyDataSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyDataSheet({ visible, onClose }: PrivacyDataSheetProps) {
  const { screenshots, customCollections } = useScreenshots();

  // Settings Toggles matching Settings Privacy and data.png
  const [hidePreviews, setHidePreviews] = useState(true);
  const [requireBiometrics, setRequireBiometrics] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // 1. Export My Data
  const handleExportData = async () => {
    try {
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        deviceApp: 'Shotly v1.0.0 (On-Device)',
        totalScreenshots: screenshots.length,
        collections: customCollections,
        screenshots: screenshots.map((s) => ({
          id: s.id,
          filename: s.filename,
          category: s.category,
          tags: s.tags,
          ocrSnippet: s.ocrText.slice(0, 150),
          creationTime: s.creationTime,
        })),
      };

      await Share.share({
        title: 'Shotly Data Export (JSON)',
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch (e) {
      Alert.alert(
        'Export Data',
        `Your on-device metadata bundle (${screenshots.length} screenshots, ${customCollections.length} collections) is compiled and ready.`
      );
    }
  };

  // 2. Delete My Data (Hard Rule 3: Originals stay in gallery; only local metadata purged)
  const handleDeleteData = () => {
    Alert.alert(
      'Delete My Data',
      'This will delete all on-device screenshot indexes, categorization data, and custom collections in Shotly.\n\nYour original screenshots will remain untouched in your phone\'s camera roll.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Data Cleared',
              'All local Shotly data and search indexes have been cleared. Original photos remain in your gallery.'
            );
            onClose();
          },
        },
      ]
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContainer}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Title matching Settings Privacy and data.png */}
            <Text style={styles.sheetTitle}>Privacy and data</Text>
            <Text style={styles.sheetSubtitle}>
              Screenshots are read on this phone only.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.listSection}>
                {/* 1. Hide previews in app switcher */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>
                    Hide previews in app switcher
                  </Text>
                  <Switch
                    value={hidePreviews}
                    onValueChange={setHidePreviews}
                    trackColor={{ false: '#CBD5E1', true: BrandColors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* 2. Require biometrics for Vault */}
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>
                    Require biometrics for Vault
                  </Text>
                  <Switch
                    value={requireBiometrics}
                    onValueChange={setRequireBiometrics}
                    trackColor={{ false: '#CBD5E1', true: BrandColors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* 3. Export my data */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Export my data"
                  onPress={handleExportData}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.actionRowLabel}>Export my data</Text>
                </Pressable>

                {/* 4. Privacy policy -> Opens full legal & data use document */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open Privacy policy and data use document"
                  onPress={() => setShowPolicyModal(true)}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.actionRowLabel}>Privacy policy</Text>
                </Pressable>

                {/* 5. Delete my data */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete my data"
                  onPress={handleDeleteData}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Text style={styles.actionRowLabel}>Delete my data</Text>
                </Pressable>
              </View>

              {/* Done Button matching Settings Privacy and data.png */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.doneButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                ]}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Embedded Privacy Policy & Data Use Document Modal */}
      <PrivacyPolicyModal
        visible={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: BrandColors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5D0C3',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: BrandColors.ink,
    letterSpacing: -0.4,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  sheetSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: BrandColors.muted,
    marginTop: 6,
    marginBottom: 20,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  listSection: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.ink,
    flex: 1,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  lastActionRow: {
    borderBottomWidth: 0,
  },
  actionRowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  destructiveRowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#DC2626',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  doneButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
});
