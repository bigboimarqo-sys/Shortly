import * as MediaLibrary from 'expo-media-library/legacy';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface ScreenshotItem {
  id: string;
  uri: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
}

export function useScreenshots() {
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [albumTitle, setAlbumTitle] = useState<string | null>(null);

  const fetchScreenshots = useCallback(async (autoRequestPermission = false) => {
    if (Platform.OS === 'web') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check or request permission
      let perm = await MediaLibrary.getPermissionsAsync(false, ['photo']);

      if (!perm.granted && autoRequestPermission) {
        perm = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
      }

      if (!perm.granted) {
        setPermissionGranted(false);
        setIsLoading(false);
        return;
      }

      setPermissionGranted(true);

      // 2. Look for the "Screenshots" album first (Android / iOS)
      let targetAlbum: MediaLibrary.Album | null = null;

      try {
        targetAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
      } catch (e) {
        // Fall through to query all albums
      }

      if (!targetAlbum) {
        try {
          const allAlbums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
          targetAlbum =
            allAlbums.find(
              (a) =>
                a.title?.toLowerCase() === 'screenshots' ||
                a.title?.toLowerCase().includes('screenshot')
            ) ?? null;
        } catch (e) {
          // Ignore album query error
        }
      }

      let assets: MediaLibrary.Asset[] = [];

      // 3. If "Screenshots" album exists and has assets, fetch from it
      if (targetAlbum && (targetAlbum.assetCount === undefined || targetAlbum.assetCount > 0)) {
        setAlbumTitle(targetAlbum.title);
        try {
          const albumResult = await MediaLibrary.getAssetsAsync({
            album: targetAlbum,
            first: 60,
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          if (albumResult?.assets && albumResult.assets.length > 0) {
            assets = albumResult.assets;
          }
        } catch (err) {
          console.warn('Failed to fetch from Screenshots album, falling back to general gallery:', err);
        }
      }

      // 4. Fallback: Query all photos sorted by newest first
      if (assets.length === 0) {
        const generalResult = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        if (generalResult?.assets && generalResult.assets.length > 0) {
          // Filter for screenshot filenames/uris
          const keywordMatches = generalResult.assets.filter((a) => {
            const name = (a.filename || '').toLowerCase();
            const uri = (a.uri || '').toLowerCase();
            return (
              name.includes('screenshot') ||
              name.includes('screen_shot') ||
              name.includes('capture') ||
              uri.includes('screenshot')
            );
          });

          // If keyword matches found, use them; otherwise use newest photos
          assets = keywordMatches.length > 0 ? keywordMatches : generalResult.assets;
        }
      }

      // 5. Map assets to ScreenshotItem with clean, valid URIs
      const mapped: ScreenshotItem[] = assets.map((a) => ({
        id: a.id || a.uri,
        uri: a.uri,
        filename: a.filename || 'Screenshot',
        creationTime: a.creationTime || Date.now(),
        width: a.width || 0,
        height: a.height || 0,
      }));

      setScreenshots(mapped);
    } catch (err: any) {
      console.warn('Error fetching device screenshots:', err);
      setError(err?.message || 'Could not load screenshots from device.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreenshots(false);
  }, [fetchScreenshots]);

  return {
    screenshots,
    isLoading,
    error,
    permissionGranted,
    albumTitle,
    refreshScreenshots: () => fetchScreenshots(true),
  };
}
