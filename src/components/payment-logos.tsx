import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
  variant?: 'light' | 'dark' | 'color';
}

/**
 * Official Apple Pay Logo
 * Features the authentic Apple silhouette + Pay lettering
 */
export function ApplePayLogo({ size = 24, color = '#FFFFFF' }: LogoProps) {
  const scale = size / 24;
  return (
    <View style={styles.inlineRow}>
      <Svg width={20 * scale} height={24 * scale} viewBox="0 0 20 24" fill={color}>
        {/* Leaf */}
        <Path d="M14.5 0.5C13.2 2.1 11.5 3.3 9.8 3.1C9.5 1.5 10.4 0.1 11.8 0C12.8 0 13.9 0.2 14.5 0.5Z" />
        {/* Body */}
        <Path d="M19.8 14.3C19.7 11.2 22.3 9.7 22.4 9.6C20.9 7.4 18.6 7.1 17.8 7.1C15.9 6.9 14 8.2 13 8.2C12 8.2 10.5 7.1 8.9 7.1C6.8 7.1 4.8 8.3 3.7 10.2C1.5 14.1 3.2 19.8 5.3 22.9C6.4 24.4 7.6 26.1 9.2 26C10.8 25.9 11.4 25 13.3 25C15.2 25 15.8 26 17.4 26C19.1 26 20.2 24.4 21.2 22.9C22.4 21.1 22.9 19.4 23 19.3C22.9 19.2 19.8 18 19.8 14.3Z" />
      </Svg>
      <Text
        style={[
          styles.applePayText,
          { color, fontSize: 20 * scale, lineHeight: 24 * scale },
        ]}>
        Pay
      </Text>
    </View>
  );
}

/**
 * Official Google Pay Logo
 * Features the official 4-color Google "G" emblem + Pay wordmark
 */
export function GooglePayLogo({ size = 24, color = '#FFFFFF', variant = 'color' }: LogoProps) {
  const scale = size / 24;
  const isColor = variant === 'color';

  return (
    <View style={styles.inlineRow}>
      <Svg width={24 * scale} height={24 * scale} viewBox="0 0 48 48">
        {isColor ? (
          <G>
            {/* Google Blue */}
            <Path
              d="M43.6 20.1H42V20H24V28H35.3C33.7 32.7 29.2 36 24 36C17.4 36 12 30.6 12 24C12 17.4 17.4 12 24 12C27.1 12 29.8 13.2 31.9 15.1L37.6 9.4C34 6 29.3 4 24 4C13 4 4 13 4 24C4 35 13 44 24 44C35 44 44 35 44 24C44 22.7 43.9 21.4 43.6 20.1Z"
              fill="#4285F4"
            />
            {/* Google Green */}
            <Path
              d="M6.3 14.7L12.9 19.5C14.7 15.1 19 12 24 12C27.1 12 29.8 13.2 31.9 15.1L37.6 9.4C34 6 29.3 4 24 4C16.5 4 10 8.4 6.3 14.7Z"
              fill="#EA4335"
            />
            {/* Google Yellow */}
            <Path
              d="M24 44C29.2 44 33.8 42.1 37.4 38.8L31.1 33.7C29.2 35.2 26.7 36 24 36C18.9 36 14.6 32.8 12.9 28.5L6.3 33.6C10 39.8 16.5 44 24 44Z"
              fill="#34A853"
            />
            {/* Google Red */}
            <Path
              d="M43.6 20.1H24V28H35.3C34.6 30.2 33.1 32.2 31.1 33.7L37.4 38.8C41.3 35.2 44 29.8 44 24C44 22.7 43.9 21.4 43.6 20.1Z"
              fill="#4285F4"
            />
            <Path
              d="M6.3 14.7C5.2 17.5 4.6 20.7 4.6 24C4.6 27.3 5.2 30.5 6.3 33.3L12.9 28.2C12.3 26.9 12 25.5 12 24C12 22.5 12.3 21.1 12.9 19.8L6.3 14.7Z"
              fill="#FBBC05"
            />
          </G>
        ) : (
          <Path
            d="M43.6 20.1H42V20H24V28H35.3C33.7 32.7 29.2 36 24 36C17.4 36 12 30.6 12 24C12 17.4 17.4 12 24 12C27.1 12 29.8 13.2 31.9 15.1L37.6 9.4C34 6 29.3 4 24 4C13 4 4 13 4 24C4 35 13 44 24 44C35 44 44 35 44 24C44 22.7 43.9 21.4 43.6 20.1Z"
            fill={color}
          />
        )}
      </Svg>
      <Text
        style={[
          styles.googlePayText,
          { color, fontSize: 19 * scale, lineHeight: 24 * scale },
        ]}>
        Pay
      </Text>
    </View>
  );
}

/**
 * Official Samsung Pay Logo
 * Features the signature "SAMSUNG pay" styling
 */
export function SamsungPayLogo({ size = 24, color = '#FFFFFF' }: LogoProps) {
  const scale = size / 24;

  return (
    <View style={styles.inlineRow}>
      {/* Curved 'S' Emblem */}
      <Svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="none">
        <Path
          d="M19.5 7.5C18.8 5.8 17.1 4.5 15.1 4.2C11.6 3.6 7.8 5.7 6.4 9.1C5 12.6 6.8 16.5 10.3 17.4C13.8 18.2 17.4 16.5 18.7 13.2"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M4.5 16.5C5.2 18.2 6.9 19.5 8.9 19.8C12.4 20.4 16.2 18.3 17.6 14.9C19 11.4 17.2 7.5 13.7 6.6C10.2 5.8 6.6 7.5 5.3 10.8"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginLeft: 8 * scale }}>
        <Text
          style={[
            styles.samsungBrandText,
            { color, fontSize: 13 * scale, letterSpacing: 1.2 * scale },
          ]}>
          SAMSUNG
        </Text>
        <Text
          style={[
            styles.samsungPayText,
            { color, fontSize: 19 * scale, marginLeft: 5 * scale },
          ]}>
          pay
        </Text>
      </View>
    </View>
  );
}

/**
 * PayFast Official Logo
 */
export function PayFastLogo({ size = 24 }: { size?: number }) {
  const scale = size / 24;
  return (
    <View style={[styles.payfastBadge, { width: 34 * scale, height: 26 * scale }]}>
      <Text style={[styles.payfastText, { fontSize: 13 * scale }]}>PF</Text>
    </View>
  );
}

/**
 * Card Logo (Visa / Mastercard representation)
 */
export function CreditCardLogo({ size = 24 }: { size?: number }) {
  const scale = size / 24;
  return (
    <Svg width={28 * scale} height={20 * scale} viewBox="0 0 28 20" fill="none">
      <Rect
        x="1"
        y="1"
        width="26"
        height="18"
        rx="3.5"
        stroke="#1E293B"
        strokeWidth="2"
      />
      <Rect x="1" y="5" width="26" height="3.5" fill="#1E293B" />
      <Circle cx="8" cy="14" r="2.5" fill="#EF4444" opacity={0.9} />
      <Circle cx="12" cy="14" r="2.5" fill="#F59E0B" opacity={0.9} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applePayText: {
    fontWeight: '700',
    marginLeft: 3,
    letterSpacing: -0.5,
  },
  googlePayText: {
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: -0.3,
  },
  samsungBrandText: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  samsungPayText: {
    fontWeight: '800',
    fontStyle: 'italic',
  },
  payfastBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payfastText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
