import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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

interface SignUpViewProps {
  onSignInPress: () => void;
  onContinueWithoutAccount?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function SignUpView({
  onSignInPress,
  onContinueWithoutAccount,
  onSuccess,
  onBack,
}: SignUpViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = () => {
    // Demo / validation handler
    if (onSuccess) onSuccess();
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Your screenshots never leave your phone.{'\n'}
              An account only keeps your plan safe.
            </Text>
          </View>

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
              onChangeText={setEmail}
            />

            <PasswordInput
              placeholder="Password (8+ characters)"
              value={password}
              onChangeText={setPassword}
            />

            {/* Checkbox */}
            <Pressable
              onPress={() => setAgreeTerms(!agreeTerms)}
              style={styles.checkboxRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreeTerms }}>
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the Terms and Privacy Policy
              </Text>
            </Pressable>

            {/* Create Account Primary Button */}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create account">
              <Text style={styles.primaryButtonText}>Create account</Text>
            </Pressable>

            {/* Continue with Google */}
            <SocialAuthButton
              provider="google"
              onPress={() => {
                if (onSuccess) onSuccess();
              }}
            />

            {/* Continue with Apple */}
            <SocialAuthButton
              provider="apple"
              onPress={() => {
                if (onSuccess) onSuccess();
              }}
            />
          </View>

          {/* Bottom Switch to Sign In */}
          <View style={styles.footer}>
            <Pressable
              onPress={onSignInPress}
              style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button">
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.linkHighlight}>Sign in</Text>
              </Text>
            </Pressable>

            {onContinueWithoutAccount && (
              <Pressable
                onPress={onContinueWithoutAccount}
                style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.7 }]}
                accessibilityRole="button">
                <Text style={styles.continueWithoutAccountText}>
                  Continue without an account
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 28,
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
  form: {
    gap: 14,
    marginBottom: 32,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#9FA5AF',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -2,
  },
  checkboxLabel: {
    color: BrandColors.ink,
    fontSize: 14,
    letterSpacing: -0.2,
    flex: 1,
  },
  primaryButton: {
    height: 54,
    backgroundColor: BrandColors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  continueWithoutAccountText: {
    fontSize: 14,
    color: BrandColors.primary,
    fontWeight: '600',
  },
});
