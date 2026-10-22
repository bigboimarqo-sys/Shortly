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

interface SignInViewProps {
  onSignUpPress: () => void;
  onContinueWithoutAccount: () => void;
  onForgotPasswordPress?: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function SignInView({
  onSignUpPress,
  onContinueWithoutAccount,
  onForgotPasswordPress,
  onSuccess,
  onBack,
}: SignInViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your subscription and{'\n'}
              keep your plan on any device.
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
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
            />

            {/* Sign in Primary Button */}
            <Pressable
              onPress={handleSignIn}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign in">
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>

            {/* Forgot password link */}
            <Pressable
              onPress={onForgotPasswordPress}
              style={({ pressed }) => [styles.forgotPasswordButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button">
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
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

            <Pressable
              onPress={onContinueWithoutAccount}
              style={({ pressed }) => [styles.linkButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button">
              <Text style={styles.continueWithoutAccountText}>
                Continue without an account
              </Text>
            </Pressable>
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
  continueWithoutAccountText: {
    fontSize: 15,
    color: BrandColors.primary,
    fontWeight: '600',
  },
});
