import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { BrandColors } from '@/constants/theme';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  containerStyle?: StyleProp<ViewStyle>;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Password',
  containerStyle,
  style,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor="#8E95A0"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
      <Pressable
        onPress={() => setShowPassword((prev) => !prev)}
        style={({ pressed }) => [styles.eyeButton, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Image
          source={
            showPassword
              ? require('@/assets/icons/eye-off.svg')
              : require('@/assets/icons/eye.svg')
          }
          style={styles.eyeIcon}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: BrandColors.ink,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 22,
    height: 22,
  },
});
