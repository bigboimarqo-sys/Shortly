import React, { useState } from 'react';
import {
  ActivityIndicator,
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

import { PasswordInput } from '@/components/password-input';
import { SocialAuthButton } from '@/components/social-auth-button';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

interface SignInViewProps {
  onSignUpPress: () => void;
  onForgotPasswordPress?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function SignInView({
  onSignUpPress,
  onForgotPasswordPress,
  onSuccess,
  onBack,
}: SignInViewProps) {
  const { signIn, signInWithOAuth, resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  // Forgot password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleForgotPasswordClick = () => {
    if (onForgotPasswordPress) {
      onForgotPasswordPress();
    } else {
      setResetEmail(email.trim());
      setResetSuccess(false);
      setResetError(null);
      setShowResetModal(true);
    }
  };

  const handleSendResetEmail = async () => {
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setResetError(null);
    try {
      const { error } = await resetPassword(cleanEmail);
      if (error) {
        setResetError(error.message || 'Failed to send reset link. Please check your email.');
      } else {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setResetError(err?.message || 'Something went wrong.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignIn = async () => {
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const { error } = await signIn(cleanEmail, password);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setErrorMessage(null);
    setSocialLoading(provider);
    try {
      const { error, user } = await signInWithOAuth(provider);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      if (user && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {onBack && (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Back">
              <Text style={styles.backButtonText}>&larr; Back</Text>
            </Pressable>
          )}

          {/* Header Title & Subtitle */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your library and{'\n'}
              active 7-day free trial.
            </Text>
          </View>

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Inputs */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8E95A0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errorMessage) setErrorMessage(null);
              }}
            />

            <PasswordInput
              placeholder="Password"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errorMessage) setErrorMessage(null);
              }}
            />

            {/* Sign in Primary Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign in">
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </Pressable>

            {/* Forgot password link */}
            <Pressable
              onPress={handleForgotPasswordClick}
              style={({ pressed }) => [styles.forgotPasswordButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button">
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            {/* Continue with Google */}
            <SocialAuthButton
              provider="google"
              isLoading={socialLoading === 'google'}
              disabled={isLoading || socialLoading !== null}
              onPress={() => handleSocialAuth('google')}
            />

            {/* Continue with Apple */}
            <SocialAuthButton
              provider="apple"
              isLoading={socialLoading === 'apple'}
              disabled={isLoading || socialLoading !== null}
              onPress={() => handleSocialAuth('apple')}
            />
          </View>

          {/* Bottom Footer Links */}
          <View style={styles.footer}>
            <Pressable
              onPress={onSignUpPress}
              style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button">
              <Text style={styles.footerText}>
                New to Shotly?{' '}
                <Text style={styles.linkHighlight}>Create an account</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={showResetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResetModal(false)}>
        <View style={styles.resetModalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.resetModalKeyboard}>
            <View style={styles.resetModalContent}>
              <View style={styles.resetModalHeader}>
                <Text style={styles.resetModalTitle}>Reset Password</Text>
                <Pressable
                  onPress={() => setShowResetModal(false)}
                  style={({ pressed }) => [styles.resetModalClose, pressed && { opacity: 0.7 }]}>
                  <Text style={styles.resetModalCloseText}>✕</Text>
                </Pressable>
              </View>

              {resetSuccess ? (
                <View style={styles.resetSuccessBox}>
                  <Text style={styles.resetSuccessEmoji}>✉️</Text>
                  <Text style={styles.resetSuccessTitle}>Check your inbox</Text>
                  <Text style={styles.resetSuccessDesc}>
                    We’ve sent password reset instructions to{' '}
                    <Text style={{ fontWeight: '700', color: BrandColors.ink }}>
                      {resetEmail}
                    </Text>
                    .
                  </Text>
                  <Pressable
                    onPress={() => setShowResetModal(false)}
                    style={styles.resetDoneBtn}>
                    <Text style={styles.resetDoneBtnText}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text style={styles.resetModalDesc}>
                    Enter your email address and we'll send you a secure link to reset your password.
                  </Text>

                  {resetError && (
                    <View style={styles.resetErrorBox}>
                      <Text style={styles.resetErrorText}>{resetError}</Text>
                    </View>
                  )}

                  <TextInput
                    style={styles.resetInput}
                    placeholder="name@example.com"
                    placeholderTextColor="#8E95A0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={resetEmail}
                    onChangeText={(val) => {
                      setResetEmail(val);
                      if (resetError) setResetError(null);
                    }}
                  />

                  <Pressable
                    onPress={handleSendResetEmail}
                    disabled={resetLoading}
                    style={({ pressed }) => [
                      styles.resetSendBtn,
                      pressed && styles.buttonPressed,
                      resetLoading && styles.buttonDisabled,
                    ]}>
                    {resetLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.resetSendBtnText}>Send Reset Link</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: BrandColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: BrandColors.muted,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  errorBanner: {
    backgroundColor: '#FDE8E8',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: 14,
    marginBottom: 24,
  },
  input: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: BrandColors.ink,
  },
  primaryButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  forgotPasswordText: {
    color: BrandColors.primary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  footerText: {
    fontSize: 15,
    color: BrandColors.ink,
  },
  linkHighlight: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  resetModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 31, 0.65)',
    justifyContent: 'flex-end',
  },
  resetModalKeyboard: {
    width: '100%',
  },
  resetModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  resetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resetModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.ink,
    letterSpacing: -0.3,
  },
  resetModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetModalCloseText: {
    fontSize: 14,
    color: BrandColors.ink,
    fontWeight: '600',
  },
  resetModalDesc: {
    fontSize: 14,
    color: BrandColors.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  resetErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  resetErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  resetInput: {
    height: 52,
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: BrandColors.ink,
    backgroundColor: BrandColors.paper,
    marginBottom: 16,
  },
  resetSendBtn: {
    height: 50,
    backgroundColor: BrandColors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetSendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resetSuccessBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resetSuccessEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  resetSuccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.ink,
    marginBottom: 8,
  },
  resetSuccessDesc: {
    fontSize: 14,
    color: BrandColors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  resetDoneBtn: {
    width: '100%',
    height: 48,
    backgroundColor: BrandColors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
