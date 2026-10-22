import * as Device from 'expo-device';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { BrandLogo } from '@/components/brand-logo';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          {/* Dynamic Brand Logo: switches to watermark dark in dark mode and watermark in light mode */}
          <BrandLogo height={48} style={styles.brandLogo} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            On-device screenshot scanner &amp; search
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          active theme: {isDark ? 'dark (watermark dark)' : 'light (watermark)'}
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <HintRow
            title="Active Logo"
            hint={
              <ThemedText type="code">
                {isDark ? 'wordmark-dark' : 'wordmark-light'}
              </ThemedText>
            }
          />
          <HintRow
            title="Try editing"
            hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
          />
          <HintRow title="Dev tools" hint={getDevMenuHint()} />
        </ThemedView>

        {/* Side-by-side preview of both light & dark logos */}
        <ThemedView type="backgroundElement" style={styles.previewContainer}>
          <ThemedText type="smallBold" style={styles.previewTitle}>
            Logo Mode Showcase
          </ThemedText>
          <View style={styles.previewRow}>
            {/* Light Mode Preview Card */}
            <View style={[styles.card, styles.cardLight]}>
              <ThemedText type="small" style={styles.cardLabelLight}>
                Light Mode
              </ThemedText>
              <BrandLogo mode="light" height={28} />
            </View>

            {/* Dark Mode Preview Card */}
            <View style={[styles.card, styles.cardDark]}>
              <ThemedText type="small" style={styles.cardLabelDark}>
                Dark Mode
              </ThemedText>
              <BrandLogo mode="dark" height={28} />
            </View>
          </View>
        </ThemedView>

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  brandLogo: {
    marginTop: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
  },
  previewContainer: {
    alignSelf: 'stretch',
    padding: Spacing.three,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  previewTitle: {
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  card: {
    flex: 1,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  cardLight: {
    backgroundColor: '#F6F4EE',
    borderWidth: 1,
    borderColor: '#E0DDD3',
  },
  cardDark: {
    backgroundColor: BrandColors.darkCard,
    borderWidth: 1,
    borderColor: '#343E4D',
  },
  cardLabelLight: {
    color: '#5D646C',
    fontSize: 11,
  },
  cardLabelDark: {
    color: '#7FA6D1',
    fontSize: 11,
  },
});
