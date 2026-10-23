import {
  Check,
  EyeClosed,
  Lock,
  NavArrowLeft,
  ShareAndroid,
  Shield,
  Sparks,
  Xmark,
} from 'iconoir-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors, MaxContentWidth } from '@/constants/theme';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

type PrivacyTab = 'policy' | 'data_use' | 'popia';

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const [activeTab, setActiveTab] = useState<PrivacyTab>('policy');

  const handleSharePolicy = async () => {
    try {
      await Share.share({
        title: 'Shotly Privacy Policy & Data Use Document',
        message:
          'Shotly Privacy Guarantee: All screenshot images and OCR text stay strictly on your device. Zero cloud transmission. https://shotly.co.za/privacy',
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to previous screen"
              onPress={onClose}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <NavArrowLeft color={BrandColors.ink} width={24} height={24} strokeWidth={2.4} />
              <Text style={styles.backBtnText}>Back</Text>
            </Pressable>

            <Text style={styles.headerTitle}>Legal & Privacy</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share privacy policy"
              onPress={handleSharePolicy}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
              <ShareAndroid color={BrandColors.ink} width={20} height={20} strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('policy')}
              style={[styles.tabItem, activeTab === 'policy' && styles.tabItemActive]}>
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === 'policy' && styles.tabItemTextActive,
                ]}>
                Privacy Policy
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('data_use')}
              style={[styles.tabItem, activeTab === 'data_use' && styles.tabItemActive]}>
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === 'data_use' && styles.tabItemTextActive,
                ]}>
                Data Use
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('popia')}
              style={[styles.tabItem, activeTab === 'popia' && styles.tabItemActive]}>
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === 'popia' && styles.tabItemTextActive,
                ]}>
                POPIA Compliance
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Quick Guarantees Box */}
            <View style={styles.guaranteeBox}>
              <View style={styles.guaranteeHeader}>
                <Shield color={BrandColors.primary} width={20} height={20} strokeWidth={2.5} />
                <Text style={styles.guaranteeTitle}>The Shotly Privacy Charter</Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Check color="#15803D" width={16} height={16} strokeWidth={3} />
                <Text style={styles.guaranteeText}>
                  <Text style={styles.boldText}>100% On-Device Processing:</Text> Images and OCR text never leave your phone.
                </Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Check color="#15803D" width={16} height={16} strokeWidth={3} />
                <Text style={styles.guaranteeText}>
                  <Text style={styles.boldText}>Zero SDK Telemetry:</Text> No analytics or external SDK ever receives your screenshot pixels.
                </Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Check color="#15803D" width={16} height={16} strokeWidth={3} />
                <Text style={styles.guaranteeText}>
                  <Text style={styles.boldText}>Gallery Untouched:</Text> Original photos stay in your camera roll.
                </Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Check color="#15803D" width={16} height={16} strokeWidth={3} />
                <Text style={styles.guaranteeText}>
                  <Text style={styles.boldText}>No Payment Data Stored:</Text> Zero credit card or banking details stored in Shotly.
                </Text>
              </View>
            </View>

            {/* TAB 1: PRIVACY POLICY */}
            {activeTab === 'policy' && (
              <View style={styles.documentBody}>
                <Text style={styles.sectionHeading}>1. Introduction & Overview</Text>
                <Text style={styles.paragraph}>
                  Welcome to Shotly ("we", "our", or "us"). Shotly is an intelligent screenshot organization and text recognition mobile application designed specifically with privacy-first architecture for the South African market and global users.
                </Text>
                <Text style={styles.paragraph}>
                  This Privacy Policy explains how information is processed when you use Shotly on Android or iOS. Unlike traditional cloud photo organizers, Shotly is engineered around a core principle: <Text style={styles.boldText}>your personal screenshots belong to you and stay on your phone.</Text>
                </Text>

                <Text style={styles.sectionHeading}>2. Information We Process</Text>
                <Text style={styles.paragraph}>
                  Shotly processes information locally on your device to deliver the MVP features:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Screenshot Media:</Text> Reads screenshot image files from your local gallery to identify text and categorize them.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>OCR Text &amp; Index:</Text> Optical Character Recognition (OCR) is performed on-device (via Apple Vision on iOS and Google ML Kit on Android). The resulting index is stored strictly in your phone's local SQLite database.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>User Categorization &amp; Tags:</Text> Custom collections (e.g. Receipts, Work, Finance, Travel) and tags you create stay on-device.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Account Credentials (Optional):</Text> If you sign up with Supabase authentication, we store only your email address and authentication session token.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>3. Subscriptions & Payment Information</Text>
                <Text style={styles.paragraph}>
                  Shotly offers a Free tier and a Shotly Plus subscription (ZAR R349 / year or R39 / month with a 7-day free trial).
                </Text>
                <Text style={styles.paragraph}>
                  <Text style={styles.boldText}>We never collect, store, or log card numbers, CVVs, or bank account details.</Text> Payment transactions are executed directly by certified third-party payment gateways (Apple In-App Purchases, Google Play Billing, or PayFast). Shotly only receives an anonymous provider reference and an entitlement token indicating whether your Plus subscription is active.
                </Text>

                <Text style={styles.sectionHeading}>4. Offline-First Guarantee</Text>
                <Text style={styles.paragraph}>
                  Every core feature of Shotly v1.0 — including OCR text recognition, search, categories, collections, duplicate clean-up, and Private Vault — works completely offline with no network connection required.
                </Text>

                <Text style={styles.sectionHeading}>5. Changes to this Policy</Text>
                <Text style={styles.paragraph}>
                  Any updates to this document will be communicated through the app. Continued use of Shotly confirms your acceptance of the updated privacy charter.
                </Text>
              </View>
            )}

            {/* TAB 2: DATA USE & ON-DEVICE SECURITY */}
            {activeTab === 'data_use' && (
              <View style={styles.documentBody}>
                <Text style={styles.sectionHeading}>1. How Shotly Uses Your Data</Text>
                <Text style={styles.paragraph}>
                  Shotly strictly limits data usage to providing user-facing functionality on your device:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Text Search:</Text> Enables you to query words, store names, prices, or numbers inside your photos instantly.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Smart Categorization:</Text> Assigns screenshots to 10 smart buckets (Receipts, Recipes, Work, Chats, Tickets, Maps, Memes, Fashion, Finance, Travel).
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>AI Assist &amp; Insights:</Text> Generates contextual summaries, detects actionable links/OTPs/amounts, and suggests tags without sending image data to remote servers.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Clean-Up Tool:</Text> Compares on-device metadata to help you identify duplicate or expired temporary screenshots to free up storage space.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>2. Storage & Vault Security</Text>
                <Text style={styles.paragraph}>
                  Screenshots added to your <Text style={styles.boldText}>Private Vault</Text> receive dedicated security safeguards:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>
                    • Biometric Authentication (Face ID / Fingerprint / Device PIN) required for access.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • App Switcher Obfuscation: Prevents screenshots from showing in iOS/Android recent app previews when enabled in Settings.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • Isolation: Vault screenshots are excluded from global searches until unlocked.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>3. Data Export & Portability</Text>
                <Text style={styles.paragraph}>
                  You maintain full ownership of your data at all times. Using the <Text style={styles.boldText}>"Export my data"</Text> feature under Settings &gt; Privacy and data, you can export a JSON bundle containing your complete collections structure, tags, and extracted metadata.
                </Text>

                <Text style={styles.sectionHeading}>4. Absolute Data Erasure</Text>
                <Text style={styles.paragraph}>
                  Selecting <Text style={styles.boldText}>"Delete my data"</Text> immediately purges all local SQLite records, search indexes, custom collections, and application caches from your device. Your original photo files remain safely in your camera roll.
                </Text>
              </View>
            )}

            {/* TAB 3: POPIA COMPLIANCE (SOUTH AFRICA) */}
            {activeTab === 'popia' && (
              <View style={styles.documentBody}>
                <Text style={styles.sectionHeading}>1. South Africa POPI Act Compliance</Text>
                <Text style={styles.paragraph}>
                  Shotly is designed in full alignment with the <Text style={styles.boldText}>Protection of Personal Information Act, 2013 (POPIA)</Text> of South Africa.
                </Text>
                <Text style={styles.paragraph}>
                  Because Shotly processes your screenshot content locally on your device rather than uploading it to an operator or responsible party cloud server, your personal information is not subject to cross-border transfer or external cloud data breaches.
                </Text>

                <Text style={styles.sectionHeading}>2. Your Rights as a Data Subject</Text>
                <Text style={styles.paragraph}>
                  Under POPIA, you have the following rights, all directly executable within Shotly:
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Right to Access:</Text> View any extracted text and category information associated with your screenshots at any time via the Screenshot Detail view.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Right to Rectification:</Text> Edit or recategorize any screenshot or tag at your discretion.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Right to Deletion (Section 24):</Text> Delete individual screenshots or initiate a complete wipe of all app metadata via Settings &gt; Privacy and data.
                  </Text>
                  <Text style={styles.bulletItem}>
                    • <Text style={styles.boldText}>Right to Object:</Text> Revoke photo gallery access anytime via your phone's operating system settings.
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>3. Information Officer Contact</Text>
                <Text style={styles.paragraph}>
                  For questions regarding privacy, POPIA compliance, or data governance, you may contact our designated Information Officer:
                </Text>
                <View style={styles.contactCard}>
                  <Text style={styles.contactTitle}>Shotly Information Officer</Text>
                  <Text style={styles.contactText}>Email: privacy@shotly.co.za</Text>
                  <Text style={styles.contactText}>Physical Address: Cape Town, South Africa</Text>
                  <Text style={styles.contactText}>Support Desk: Accessible 24/7 via Settings &gt; 24/7 Live AI Support</Text>
                </View>
              </View>
            )}

            {/* Bottom Done Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close privacy policy"
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.3,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: BrandColors.paper,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  tabItemActive: {
    backgroundColor: BrandColors.primary,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.muted,
  },
  tabItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  guaranteeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E2EE',
    marginBottom: 24,
    gap: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  guaranteeText: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.ink,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: BrandColors.ink,
  },
  documentBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BrandColors.border,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.ink,
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 12,
  },
  bulletList: {
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
  },
  contactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    gap: 4,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 4,
  },
  contactText: {
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
