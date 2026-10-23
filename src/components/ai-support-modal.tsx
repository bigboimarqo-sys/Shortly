import {
  ChatBubble,
  Check,
  HeadsetHelp,
  NavArrowRight,
  Send,
  Sparks,
  Xmark,
} from 'iconoir-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
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

import { BrandColors, MaxContentWidth } from '@/constants/theme';
import { AIService, SupportChatMessage } from '@/services/ai-service';

interface AISupportModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenPaywall?: () => void;
  onOpenPermissions?: () => void;
  onOpenSettings?: () => void;
  onOpenCollections?: () => void;
  onOpenCleanUp?: () => void;
}

const QUICK_PROMPTS = [
  'How does the 7-day free trial work?',
  'What is Shotly Plus pricing in ZAR?',
  'Are my screenshots kept private?',
  'How do I search text inside screenshots?',
  'Why are new screenshots not showing?',
  'How to clean up duplicates & expired OTPs?',
];

export function AISupportModal({
  visible,
  onClose,
  onOpenPaywall,
  onOpenPermissions,
  onOpenSettings,
  onOpenCollections,
  onOpenCleanUp,
}: AISupportModalProps) {
  const [messages, setMessages] = useState<SupportChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: "👋 Hi! I'm your Shotly 24/7 AI Support Assistant. I'm always online to help you with subscriptions, pricing in ZAR, on-device OCR search, permissions, and privacy. How can I assist you today?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, visible, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: SupportChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate natural AI thought and stream delay
    setTimeout(() => {
      const aiResponse = AIService.generateSupportResponse(text);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleActionLink = (action: SupportChatMessage['actionLink']) => {
    if (!action) return;
    onClose();
    setTimeout(() => {
      if (action.type === 'paywall' && onOpenPaywall) onOpenPaywall();
      else if (action.type === 'permissions' && onOpenPermissions) onOpenPermissions();
      else if (action.type === 'settings' && onOpenSettings) onOpenSettings();
      else if (action.type === 'collections' && onOpenCollections) onOpenCollections();
      else if (action.type === 'clean_up' && onOpenCleanUp) onOpenCleanUp();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarBox}>
                <HeadsetHelp color="#FFFFFF" width={20} height={20} strokeWidth={2.5} />
                <View style={styles.onlineBadge} />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.agentTitle}>Shotly AI Support</Text>
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>24/7 LIVE</Text>
                  </View>
                </View>
                <Text style={styles.statusSubtitle}>🟢 Always Online · Instant Replies</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close support chat"
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Xmark color={BrandColors.ink} width={20} height={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* Quick Prompts Bar */}
          <View style={styles.promptsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promptsScroll}>
              {QUICK_PROMPTS.map((prompt, index) => (
                <Pressable
                  key={`prompt-${index}`}
                  onPress={() => handleSendMessage(prompt)}
                  style={({ pressed }) => [
                    styles.promptChip,
                    pressed && { opacity: 0.7, backgroundColor: '#E2E8F0' },
                  ]}>
                  <Sparks color={BrandColors.primary} width={13} height={13} strokeWidth={2.5} />
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}>
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.userMessageRow : styles.aiMessageRow,
                  ]}>
                  {!isUser && (
                    <View style={styles.aiMessageAvatar}>
                      <HeadsetHelp color="#FFFFFF" width={14} height={14} strokeWidth={2.4} />
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.userBubble : styles.aiBubble,
                    ]}>
                    <Text
                      style={[
                        styles.bubbleText,
                        isUser ? styles.userBubbleText : styles.aiBubbleText,
                      ]}>
                      {msg.text}
                    </Text>

                    {/* Action Button inside message */}
                    {msg.actionLink && (
                      <Pressable
                        onPress={() => handleActionLink(msg.actionLink)}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && { opacity: 0.8 },
                        ]}>
                        <Text style={styles.actionButtonText}>
                          {msg.actionLink.label}
                        </Text>
                        <NavArrowRight color="#FFFFFF" width={16} height={16} strokeWidth={2.5} />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <View style={[styles.messageRow, styles.aiMessageRow]}>
                <View style={styles.aiMessageAvatar}>
                  <HeadsetHelp color="#FFFFFF" width={14} height={14} strokeWidth={2.4} />
                </View>
                <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={BrandColors.primary} />
                  <Text style={styles.typingText}>Shotly AI is typing...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Privacy Note */}
          <View style={styles.privacyNoteBox}>
            <Text style={styles.privacyNoteText}>
              🔒 Secure 24/7 AI Support. Your screenshot images and OCR text are never sent to support.
            </Text>
          </View>

          {/* Bottom Input Area */}
          <View style={styles.inputBar}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question about Shotly..."
              placeholderTextColor="#9CA3AF"
              style={styles.textInput}
              multiline={false}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
            />
            <Pressable
              disabled={!inputText.trim() || isTyping}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              onPress={() => handleSendMessage()}
              style={({ pressed }) => [
                styles.sendBtn,
                !inputText.trim() && styles.sendBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}>
              <Send color="#FFFFFF" width={18} height={18} strokeWidth={2.5} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  keyboardAvoid: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.ink,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  liveTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  statusSubtitle: {
    fontSize: 12,
    color: BrandColors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
  },
  promptsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.ink,
  },
  chatScroll: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  chatScrollContent: {
    padding: 18,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '85%',
  },
  userMessageRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessageRow: {
    alignSelf: 'flex-start',
  },
  aiMessageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: BrandColors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: BrandColors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.select({
      web: "'Space Grotesk', system-ui, sans-serif",
      default: undefined,
    }),
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  aiBubbleText: {
    color: BrandColors.ink,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: 13,
    color: BrandColors.muted,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  privacyNoteBox: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
    alignItems: 'center',
  },
  privacyNoteText: {
    fontSize: 11,
    color: BrandColors.muted,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: BrandColors.paper,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: BrandColors.ink,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
