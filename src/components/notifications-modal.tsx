import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, Check, Xmark } from 'iconoir-react-native';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { BrandColors } from '@/constants/theme';

export const NOTIFICATIONS_STORAGE_KEY = '@shotly_notification_preferences';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const [screenshotReminders, setScreenshotReminders] = useState(true);
  const [cleanupPrompts, setCleanupPrompts] = useState(true);
  const [vaultSecurityAlerts, setVaultSecurityAlerts] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY).then((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (typeof parsed.screenshotReminders === 'boolean') {
              setScreenshotReminders(parsed.screenshotReminders);
            }
            if (typeof parsed.cleanupPrompts === 'boolean') {
              setCleanupPrompts(parsed.cleanupPrompts);
            }
            if (typeof parsed.vaultSecurityAlerts === 'boolean') {
              setVaultSecurityAlerts(parsed.vaultSecurityAlerts);
            }
          } catch {
            // ignore
          }
        }
      });
    }
  }, [visible]);

  const savePreferences = async (
    reminders: boolean,
    cleanup: boolean,
    vault: boolean
  ) => {
    const payload = {
      screenshotReminders: reminders,
      cleanupPrompts: cleanup,
      vaultSecurityAlerts: vault,
    };
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(payload));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Bell color={BrandColors.primary} width={20} height={20} strokeWidth={2.4} />
              </View>
              <Text style={styles.title}>Notifications</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close notifications modal"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Xmark color={BrandColors.muted} width={20} height={20} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Choose what notifications Shotly sends on this device. All processing stays local.
          </Text>

          {savedToast && (
            <View style={styles.toast}>
              <Check color="#15803D" width={14} height={14} strokeWidth={3} />
              <Text style={styles.toastText}>Preferences saved</Text>
            </View>
          )}

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* 1. Screenshot Reminders */}
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Screenshot Reminders</Text>
                <Text style={styles.rowDesc}>
                  Weekly notification summarizing new screenshots categorised on-device.
                </Text>
              </View>
              <Switch
                value={screenshotReminders}
                onValueChange={(val) => {
                  setScreenshotReminders(val);
                  savePreferences(val, cleanupPrompts, vaultSecurityAlerts);
                }}
                trackColor={{ false: '#CBD5E1', true: BrandColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 2. Clean-Up Prompts */}
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Clean-Up Suggestions</Text>
                <Text style={styles.rowDesc}>
                  Alerts when duplicate or low-value screenshots take up over 200MB.
                </Text>
              </View>
              <Switch
                value={cleanupPrompts}
                onValueChange={(val) => {
                  setCleanupPrompts(val);
                  savePreferences(screenshotReminders, val, vaultSecurityAlerts);
                }}
                trackColor={{ false: '#CBD5E1', true: BrandColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* 3. Private Vault Security Alerts */}
            <View style={styles.row}>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Private Vault Security</Text>
                <Text style={styles.rowDesc}>
                  Alert if confidential screenshots are detected in your main gallery.
                </Text>
              </View>
              <Switch
                value={vaultSecurityAlerts}
                onValueChange={(val) => {
                  setVaultSecurityAlerts(val);
                  savePreferences(screenshotReminders, cleanupPrompts, val);
                }}
                trackColor={{ false: '#CBD5E1', true: BrandColors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.4,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  subtitle: {
    fontSize: 14,
    color: BrandColors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  toastText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollList: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  rowDesc: {
    fontSize: 13,
    color: BrandColors.muted,
    lineHeight: 18,
  },
  doneButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
