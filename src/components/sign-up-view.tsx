import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '@/context/auth-context';

interface SignUpViewProps {
  onSignInPress: () => void;
  onSuccess?: () => void;
  onBack?: () => void;
}

export function SignUpView({
  onSignInPress,
  onSuccess,
  onBack,
}: SignUpViewProps) {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please agree to the Terms and Privacy Policy to continue.');
      return;
    }

    const { error, user } = await signUp(cleanEmail, password);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (user && !user.confirmed_at && user.identities?.length) {
      setSuccessInfo('Account created! Please check your email to confirm your account.');
    }

    if (onSuccess) {
      onSuccess();
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Register to start your 7-day free trial.{'\n'}
              Your screenshots stay 100% private on your phone.
            </Text>
          </View>

          {/* Status Messages */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successInfo && (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successInfo}</Text>
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
              placeholder="Password (8+ characters)"
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errorMessage) setErrorMessage(null);
              }}
            />

            {/* Checkbox */}
            <Pressable
              onPress={() => {
                setAgreeTerms(!agreeTerms);
                if (errorMessage) setErrorMessage(null);
              }}
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
              disabled={isLoading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create account and start 7-day trial">
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Create account &amp; start trial</Text>
              )}
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
  successBanner: {
    backgroundColor: '#DEF7EC',
    borderColor: '#31C48D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#03543F',
    fontSize: 14,
    fontWeight: '500',
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
  buttonDisabled: {
    opacity: 0.6,
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
});
