import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Shares an actual screenshot/image file to native share sheets
 * (WhatsApp, Messages, AirDrop, Gmail, Telegram, etc.) instead of
 * sharing as a text link or description.
 */
export async function shareScreenshotImage(
  uri: string,
  filename?: string
): Promise<boolean> {
  try {
    if (!uri) {
      Alert.alert('Error', 'No image available to share.');
      return false;
    }

    const safeFilename =
      filename?.replace(/[/\\?%*:|"<>]/g, '_') || `screenshot_${Date.now()}.png`;

    const isJpg =
      safeFilename.toLowerCase().endsWith('.jpg') ||
      safeFilename.toLowerCase().endsWith('.jpeg');
    const isSvg =
      safeFilename.toLowerCase().endsWith('.svg') ||
      uri.startsWith('data:image/svg+xml');

    const mimeType = isSvg
      ? 'image/svg+xml'
      : isJpg
      ? 'image/jpeg'
      : 'image/png';
    const uti = isSvg ? 'public.svg-image' : isJpg ? 'public.jpeg' : 'public.png';

    // 1. Web Platform
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
        // Try Web Share API with actual File blob
        if (navigator.share && navigator.canShare) {
          try {
            const res = await fetch(uri);
            const blob = await res.blob();
            const file = new File([blob], safeFilename, { type: mimeType });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: safeFilename,
              });
              return true;
            }
          } catch (e) {
            // Fall through to download fallback
          }
        }

        // Web download fallback: downloads the actual screenshot image file
        const link = document.createElement('a');
        link.href = uri;
        link.download = safeFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }
      return false;
    }

    // 2. Native Mobile (iOS & Android)
    let localFilePath = uri;

    // Handle SVG Data URI
    if (uri.startsWith('data:image/svg+xml')) {
      const cleanSvg = decodeURIComponent(
        uri.replace(/^data:image\/svg\+xml;utf8,/, '')
      );
      const targetName = safeFilename.endsWith('.svg')
        ? safeFilename
        : `${safeFilename.replace(/\.[^/.]+$/, '')}.svg`;
      const targetPath = `${FileSystem.cacheDirectory}${targetName}`;
      await FileSystem.writeAsStringAsync(targetPath, cleanSvg, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      localFilePath = targetPath;
    }
    // Handle Base64 Data URI
    else if (uri.startsWith('data:image/')) {
      const parts = uri.split(',');
      const base64Data = parts[1];
      const targetPath = `${FileSystem.cacheDirectory}${safeFilename}`;
      await FileSystem.writeAsStringAsync(targetPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      localFilePath = targetPath;
    }
    // Handle Remote URL
    else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const targetPath = `${FileSystem.cacheDirectory}${safeFilename}`;
      const downloadRes = await FileSystem.downloadAsync(uri, targetPath);
      localFilePath = downloadRes.uri;
    }
    // Handle Android Content URIs (copy to cache to guarantee third-party app file read access)
    else if (uri.startsWith('content://')) {
      const targetPath = `${FileSystem.cacheDirectory}${safeFilename}`;
      try {
        await FileSystem.copyAsync({ from: uri, to: targetPath });
        localFilePath = targetPath;
      } catch (err) {
        // If direct copy fails, attempt to share original uri
        localFilePath = uri;
      }
    }

    // Check if device supports native file sharing
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(localFilePath, {
        mimeType,
        dialogTitle: 'Share Screenshot',
        UTI: uti,
      });
      return true;
    } else {
      Alert.alert(
        'Sharing Not Available',
        'Sharing is not supported on this device.'
      );
      return false;
    }
  } catch (error: any) {
    console.warn('Failed to share screenshot image:', error);
    Alert.alert(
      'Share Failed',
      'Unable to share this screenshot image. Please try again.'
    );
    return false;
  }
}
