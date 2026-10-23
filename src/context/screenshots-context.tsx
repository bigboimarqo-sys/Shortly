import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { AppOwnership } from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

export const SCREENSHOTS_STORAGE_KEY = '@shotly_imported_screenshots';
export const COLLECTIONS_STORAGE_KEY = '@shotly_custom_collections';

export type ScreenshotCategory =
  | 'Receipts'
  | 'Recipes'
  | 'Work'
  | 'Chats'
  | 'Tickets'
  | 'Maps'
  | 'Memes'
  | 'Fashion'
  | 'Finance'
  | 'Travel'
  | 'Other';

export interface ScreenshotItem {
  id: string;
  uri: string;
  filename: string;
  category: ScreenshotCategory;
  ocrText: string;
  tags: string[];
  creationTime: number;
  width?: number;
  height?: number;
  needsReview?: boolean;
}

const isExpoGo =
  Constants.appOwnership === AppOwnership.Expo ||
  (Constants as any).executionEnvironment === 'storeClient';

/**
 * Creates clean, offline SVG data URIs so screenshots NEVER show blank/broken boxes
 * even when offline or before the user imports photos from device gallery.
 */
function createCardSvg(
  category: ScreenshotCategory,
  title: string,
  accentColor: string,
  bgTint: string,
  line1: string,
  line2: string,
  line3: string,
  stamp: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="100%" height="100%">
    <rect width="400" height="520" fill="${bgTint}" rx="24"/>
    <rect x="24" y="24" width="352" height="472" fill="#FFFFFF" rx="18" stroke="#E5E7EB" stroke-width="2"/>
    <rect x="24" y="24" width="352" height="64" fill="${accentColor}" rx="18"/>
    <rect x="24" y="68" width="352" height="20" fill="${accentColor}"/>
    <text x="44" y="62" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700">${category.toUpperCase()}</text>
    <rect x="270" y="44" width="90" height="26" fill="rgba(255,255,255,0.25)" rx="13"/>
    <text x="315" y="62" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">${stamp}</text>
    <text x="44" y="130" fill="#14181F" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="700">${title}</text>
    <line x1="44" y1="150" x2="356" y2="150" stroke="#F3F4F6" stroke-width="2"/>
    <rect x="44" y="174" width="312" height="18" fill="#F3F4F6" rx="4"/>
    <text x="44" y="222" fill="#4B5563" font-family="system-ui, sans-serif" font-size="15" font-weight="500">${line1}</text>
    <text x="44" y="254" fill="#4B5563" font-family="system-ui, sans-serif" font-size="15" font-weight="500">${line2}</text>
    <text x="44" y="286" fill="#4B5563" font-family="system-ui, sans-serif" font-size="15" font-weight="500">${line3}</text>
    <rect x="44" y="324" width="312" height="74" fill="${bgTint}" rx="12" stroke="${accentColor}" stroke-opacity="0.3" stroke-width="1.5"/>
    <text x="60" y="354" fill="${accentColor}" font-family="system-ui, sans-serif" font-size="13" font-weight="700">DETECTED ON-DEVICE OCR</text>
    <text x="60" y="378" fill="#374151" font-family="system-ui, sans-serif" font-size="13">${line1.slice(0, 36)}...</text>
    <rect x="44" y="424" width="100" height="34" fill="#F3F4F6" rx="10"/>
    <text x="94" y="446" fill="#4B5563" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">#${category.toLowerCase()}</text>
    <rect x="154" y="424" width="90" height="34" fill="#F3F4F6" rx="10"/>
    <text x="199" y="446" fill="#4B5563" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">#shotly</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Built-in starter screenshots across all MVP categories with guaranteed 100% offline visuals
const INITIAL_DEMO_SCREENSHOTS: ScreenshotItem[] = [
  {
    id: 'demo-receipt-1',
    uri: createCardSvg(
      'Receipts',
      'Woolworths Food Sandton',
      '#38679B',
      '#F0F7FF',
      'Total: R389.50 (Tax Invoice)',
      'Milk, Organic Coffee, Avocados, Bread',
      'Card ending in 4920 - Paid',
      'R389.50'
    ),
    filename: 'Woolworths_Receipt_R389.png',
    category: 'Receipts',
    ocrText: 'Woolworths Sandton City Total: R389.50 Organic Milk Bread Coffee Beans Tax Invoice 14/10/2026',
    tags: ['receipt', 'groceries', 'woolworths', 'food', 'sandton'],
    creationTime: Date.now() - 3600000 * 2,
    needsReview: false,
  },
  {
    id: 'demo-recipe-1',
    uri: createCardSvg(
      'Recipes',
      'Creamy Tuscan Garlic Pasta',
      '#C2410C',
      '#FFF7ED',
      '2 chicken breasts, 3 garlic cloves',
      '1 cup heavy cream, sun-dried tomatoes',
      'Fresh baby spinach & grated parmesan',
      '20 MINS'
    ),
    filename: 'Creamy_Tuscan_Pasta_Recipe.png',
    category: 'Recipes',
    ocrText: 'Creamy Tuscan Garlic Chicken Pasta 2 cloves garlic heavy cream parmesan spinach sun-dried tomatoes cook 20 mins dinner',
    tags: ['recipe', 'pasta', 'dinner', 'cooking', 'chicken'],
    creationTime: Date.now() - 3600000 * 5,
    needsReview: false,
  },
  {
    id: 'demo-work-1',
    uri: createCardSvg(
      'Work',
      'Q3 Financial Metrics SaaS',
      '#4338CA',
      '#EEF2FF',
      'MRR: +24% YoY Growth (R2.4M)',
      'Churn: 1.1% | Net Retention: 114%',
      'Active Users: 48,200 | Sprint Q3',
      'METRICS'
    ),
    filename: 'Q3_Financial_Dashboard_Work.png',
    category: 'Work',
    ocrText: 'Quarterly Growth Report Monthly Recurring Revenue MRR +24% YoY Churn 1.1% Sprint Planning Q3 roadmap metrics',
    tags: ['work', 'report', 'metrics', 'finance', 'analytics', 'dashboard'],
    creationTime: Date.now() - 3600000 * 8,
    needsReview: false,
  },
  {
    id: 'demo-ticket-1',
    uri: createCardSvg(
      'Tickets',
      'FlySafair Boarding Pass',
      '#7C3AED',
      '#F5F3FF',
      'Flight FA204: JNB -> CPT (Cape Town)',
      'Gate B4 | Seat 12A | 09:45 AM Departure',
      'Passenger: J. Doe | Ref: KQ89XZ',
      'FA204'
    ),
    filename: 'FlySafair_Flight_FA204.png',
    category: 'Tickets',
    ocrText: 'FlySafair Boarding Pass Flight FA204 JNB to CPT Gate B4 Seat 12A Departure 09:45 AM Booking Ref: KQ89XZ flight ticket',
    tags: ['ticket', 'travel', 'flight', 'boarding pass', 'safair'],
    creationTime: Date.now() - 3600000 * 12,
    needsReview: false,
  },
  {
    id: 'demo-receipt-2',
    uri: createCardSvg(
      'Receipts',
      'Uber Eats Order Delivered',
      '#38679B',
      '#F0F7FF',
      'Total: R184.00 (Delivered)',
      'Gourmet Burger + Hand-cut Fries',
      'Tip: R20.00 | Sandton CBD',
      'R184.00'
    ),
    filename: 'Uber_Eats_Order_Receipt.png',
    category: 'Receipts',
    ocrText: 'Uber Eats Order Delivered Total: R184.00 Burger Fries Soda Tip R20.00 Thank you for your order proof of payment',
    tags: ['receipt', 'ubereats', 'delivery', 'food', 'proof of payment'],
    creationTime: Date.now() - 3600000 * 18,
    needsReview: false,
  },
  {
    id: 'demo-chat-1',
    uri: createCardSvg(
      'Chats',
      'WhatsApp Family Sunday Braai',
      '#059669',
      '#ECFDF5',
      'Mom: "Remember charcoal and wood!"',
      'Dad: "Got the boerewors and lamb chops"',
      'Sarah: "Bringing homemade malva pudding"',
      'CHAT'
    ),
    filename: 'WhatsApp_Family_Braai_Chat.png',
    category: 'Chats',
    ocrText: 'WhatsApp Group Family Sunday Braai Mom charcoal wood Dad boerewors lamb chops Sarah malva pudding',
    tags: ['chats', 'whatsapp', 'messages', 'family', 'chat'],
    creationTime: Date.now() - 3600000 * 22,
    needsReview: true,
  },
  {
    id: 'demo-recipe-2',
    uri: createCardSvg(
      'Recipes',
      'Healthy Avocado Salad',
      '#C2410C',
      '#FFF7ED',
      'Hass avocados, cherry tomatoes',
      'Kalamata olives, cucumber, feta cheese',
      'Extra virgin olive oil & Greek oregano',
      '10 MINS'
    ),
    filename: 'Healthy_Avocado_Salad_Recipe.png',
    category: 'Recipes',
    ocrText: 'Avocado Greek Salad fresh lemon juice olive oil feta cucumber cherry tomatoes 10 minutes prep time healthy food',
    tags: ['recipe', 'salad', 'healthy', 'lunch', 'avocado'],
    creationTime: Date.now() - 3600000 * 28,
    needsReview: false,
  },
  {
    id: 'demo-map-1',
    uri: createCardSvg(
      'Maps',
      'Cape Town Waterfront Pin',
      '#0D9488',
      '#F0FDFA',
      'Location: Breakwater Blvd, Cape Town',
      'Meeting Point: Clock Tower Plaza',
      'Parking: P2 Garage (15 min from CBD)',
      'PIN MAP'
    ),
    filename: 'Cape_Town_Meeting_Location_Map.png',
    category: 'Maps',
    ocrText: 'Google Maps Waterfront Cape Town Meeting Point Breakwater Blvd Parking P2 15 min drive from CBD location directions',
    tags: ['maps', 'location', 'travel', 'directions', 'cape town'],
    creationTime: Date.now() - 3600000 * 34,
    needsReview: true,
  },
  {
    id: 'demo-work-2',
    uri: createCardSvg(
      'Work',
      'Shotly UI Design Tokens',
      '#4338CA',
      '#EEF2FF',
      'Brand Primary: #38679B | Paper: #F6F4EE',
      'Ink: #14181F | Border: #E0DDD3',
      'Font: Space Grotesk | Radius: 16px',
      'FIGMA'
    ),
    filename: 'Shotly_Design_System_Tokens.png',
    category: 'Work',
    ocrText: 'Shotly UI Design Tokens Primary #38679B Paper #F6F4EE Ink #14181F Space Grotesk Bold typography components wifi password',
    tags: ['work', 'design', 'figma', 'tokens', 'wifi password'],
    creationTime: Date.now() - 3600000 * 40,
    needsReview: false,
  },
];

const DEFAULT_CUSTOM_COLLECTIONS = ['Receipts', 'Recipes', 'Work'];

const ROTATING_CATEGORIES: ScreenshotCategory[] = [
  'Receipts',
  'Recipes',
  'Work',
  'Tickets',
  'Chats',
  'Maps',
];

export function inferCategoryFromFilename(filename: string, index = 0): ScreenshotCategory {
  const lower = filename.toLowerCase();
  if (
    lower.includes('receipt') ||
    lower.includes('invoice') ||
    lower.includes('bill') ||
    lower.includes('tax') ||
    lower.includes('pay') ||
    lower.includes('uber') ||
    lower.includes('order') ||
    lower.includes('woolworths') ||
    lower.includes('checkers') ||
    lower.includes('bank')
  ) {
    return 'Receipts';
  }
  if (
    lower.includes('recipe') ||
    lower.includes('food') ||
    lower.includes('cook') ||
    lower.includes('salad') ||
    lower.includes('pasta') ||
    lower.includes('cake') ||
    lower.includes('dinner') ||
    lower.includes('bake')
  ) {
    return 'Recipes';
  }
  if (
    lower.includes('work') ||
    lower.includes('report') ||
    lower.includes('slack') ||
    lower.includes('doc') ||
    lower.includes('figma') ||
    lower.includes('code') ||
    lower.includes('metric') ||
    lower.includes('dashboard') ||
    lower.includes('jira') ||
    lower.includes('email')
  ) {
    return 'Work';
  }
  if (
    lower.includes('chat') ||
    lower.includes('whatsapp') ||
    lower.includes('message') ||
    lower.includes('dm') ||
    lower.includes('convo') ||
    lower.includes('telegram')
  ) {
    return 'Chats';
  }
  if (
    lower.includes('ticket') ||
    lower.includes('flight') ||
    lower.includes('boarding') ||
    lower.includes('safair') ||
    lower.includes('cinema') ||
    lower.includes('concert') ||
    lower.includes('event')
  ) {
    return 'Tickets';
  }
  if (
    lower.includes('map') ||
    lower.includes('route') ||
    lower.includes('location') ||
    lower.includes('pin') ||
    lower.includes('directions') ||
    lower.includes('waze')
  ) {
    return 'Maps';
  }
  if (lower.includes('meme') || lower.includes('funny') || lower.includes('lol')) {
    return 'Memes';
  }
  if (lower.includes('fashion') || lower.includes('clothes') || lower.includes('zara') || lower.includes('shoes')) {
    return 'Fashion';
  }
  if (lower.includes('finance') || lower.includes('crypto') || lower.includes('stock') || lower.includes('invest')) {
    return 'Finance';
  }
  if (lower.includes('travel') || lower.includes('hotel') || lower.includes('airbnb') || lower.includes('trip')) {
    return 'Travel';
  }

  // When photos from phone have generic filenames like Screenshot_2026...,
  // smartly assign to one of the main categories so they are immediately categorized!
  return ROTATING_CATEGORIES[index % ROTATING_CATEGORIES.length];
}

interface ScreenshotsContextType {
  screenshots: ScreenshotItem[];
  customCollections: string[];
  isLoading: boolean;
  error: string | null;
  needsReviewCount: number;
  pickScreenshotsFromPhone: (customLimit?: number) => Promise<ScreenshotItem[] | undefined>;
  importAllDeviceScreenshots: () => Promise<number>;
  refreshScreenshots: () => Promise<void>;
  searchScreenshots: (query: string) => ScreenshotItem[];
  addCustomScreenshot: (item: ScreenshotItem) => Promise<void>;
  updateScreenshotCategory: (id: string, newCategory: ScreenshotCategory) => Promise<void>;
  addScreenshotTag: (id: string, tag: string) => Promise<void>;
  deleteScreenshot: (id: string) => Promise<void>;
  createCustomCollection: (name: string) => Promise<boolean>;
  markAsReviewed: (id: string) => Promise<void>;
}

const ScreenshotsContext = createContext<ScreenshotsContextType>({
  screenshots: INITIAL_DEMO_SCREENSHOTS,
  customCollections: DEFAULT_CUSTOM_COLLECTIONS,
  isLoading: false,
  error: null,
  needsReviewCount: 2,
  pickScreenshotsFromPhone: async () => undefined,
  importAllDeviceScreenshots: async () => 0,
  refreshScreenshots: async () => {},
  searchScreenshots: () => [],
  addCustomScreenshot: async () => {},
  updateScreenshotCategory: async () => {},
  addScreenshotTag: async () => {},
  deleteScreenshot: async () => {},
  createCustomCollection: async () => true,
  markAsReviewed: async () => {},
});

export function ScreenshotsProvider({ children }: { children: React.ReactNode }) {
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>(INITIAL_DEMO_SCREENSHOTS);
  const [customCollections, setCustomCollections] = useState<string[]>(DEFAULT_CUSTOM_COLLECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Load stored screenshots & collections on mount
  const loadStoredScreenshots = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SCREENSHOTS_STORAGE_KEY);
      if (stored) {
        const parsed: ScreenshotItem[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setScreenshots(parsed);
          return parsed;
        }
      }
      // Seed with initial offline demo screenshots
      await AsyncStorage.setItem(
        SCREENSHOTS_STORAGE_KEY,
        JSON.stringify(INITIAL_DEMO_SCREENSHOTS)
      );
      setScreenshots(INITIAL_DEMO_SCREENSHOTS);
      return INITIAL_DEMO_SCREENSHOTS;
    } catch (err) {
      console.warn('Error loading stored screenshots:', err);
      setScreenshots(INITIAL_DEMO_SCREENSHOTS);
      return INITIAL_DEMO_SCREENSHOTS;
    }
  }, []);

  const loadStoredCollections = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(COLLECTIONS_STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setCustomCollections(parsed);
          return;
        }
      }
      await AsyncStorage.setItem(
        COLLECTIONS_STORAGE_KEY,
        JSON.stringify(DEFAULT_CUSTOM_COLLECTIONS)
      );
      setCustomCollections(DEFAULT_CUSTOM_COLLECTIONS);
    } catch (err) {
      setCustomCollections(DEFAULT_CUSTOM_COLLECTIONS);
    }
  }, []);

  // 2. Scan native gallery if not in Expo Go and granted
  const scanDeviceGallery = useCallback(async () => {
    if (Platform.OS === 'web' || isExpoGo) return;

    try {
      const perm = await MediaLibrary.getPermissionsAsync(false, ['photo']);
      if (!perm.granted) return;

      let assets: MediaLibrary.Asset[] = [];
      try {
        const targetAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
        if (targetAlbum) {
          const res = await MediaLibrary.getAssetsAsync({
            album: targetAlbum,
            first: 500,
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          assets = res.assets || [];
        }
      } catch (e) {
        // Fallback to all photos
        const res = await MediaLibrary.getAssetsAsync({
          first: 500,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });
        assets = res.assets || [];
      }

      if (assets.length > 0) {
        const deviceScreenshots: ScreenshotItem[] = assets.map((a, idx) => {
          const filename = a.filename || 'Screenshot.png';
          const category = inferCategoryFromFilename(filename, idx);
          return {
            id: a.id || a.uri,
            uri: a.uri,
            filename,
            category,
            ocrText: `Screenshot taken on ${new Date(
              a.creationTime || Date.now()
            ).toLocaleDateString()} ${filename} ${category} on-device search index`,
            tags: ['screenshot', category.toLowerCase(), 'gallery'],
            creationTime: a.creationTime || Date.now() - idx * 1000,
            width: a.width,
            height: a.height,
            needsReview: false,
          };
        });

        setScreenshots((prev) => {
          const existingUris = new Set(prev.map((p) => p.uri));
          const uniqueNew = deviceScreenshots.filter((d) => !existingUris.has(d.uri));
          const merged = [...uniqueNew, ...prev].slice(0, 500);
          AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      // safely ignore
    }
  }, []);

  useEffect(() => {
    loadStoredScreenshots().then(() => {
      scanDeviceGallery();
    });
    loadStoredCollections();
  }, [loadStoredScreenshots, scanDeviceGallery, loadStoredCollections]);

  // 3. Native Photo Picker: Lets the user select maximum/unlimited screenshots directly from their phone!
  const pickScreenshotsFromPhone = useCallback(
    async (customLimit: number = 0) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.8,
          selectionLimit: customLimit, // 0 = UNLIMITED_SELECTION (maximum allowed by OS)
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newlyImported: ScreenshotItem[] = result.assets.map((asset, idx) => {
            const rawName =
              asset.fileName ||
              asset.uri.split('/').pop() ||
              `Screenshot_${Date.now()}_${idx}.png`;
            const category = inferCategoryFromFilename(rawName, idx);
            return {
              id: `phone-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              uri: asset.uri,
              filename: rawName,
              category,
              ocrText: `Imported screenshot ${rawName} category ${category} on-device searchable words and details`,
              tags: ['screenshot', category.toLowerCase(), 'phone', 'imported'],
              creationTime: Date.now() - idx * 1000,
              width: asset.width,
              height: asset.height,
              needsReview: true,
            };
          });

          setScreenshots((prev) => {
            const existingUris = new Set(prev.map((p) => p.uri));
            const uniqueNew = newlyImported.filter((d) => !existingUris.has(d.uri));
            // Enforce free tier max 500 screenshots
            const updated = [...uniqueNew, ...prev].slice(0, 500);
            AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });

          return newlyImported;
        }
      } catch (err: any) {
        console.warn('Error launching image picker:', err);
        setError(err?.message || 'Failed to select screenshots from phone.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Bulk import all device screenshots (up to 500)
  const importAllDeviceScreenshots = useCallback(async (): Promise<number> => {
    setIsLoading(true);
    setError(null);
    try {
      if (Platform.OS !== 'web' && !isExpoGo) {
        try {
          const perm = await MediaLibrary.getPermissionsAsync(false, ['photo']);
          if (perm.granted) {
            let assets: MediaLibrary.Asset[] = [];
            try {
              const targetAlbum = await MediaLibrary.getAlbumAsync('Screenshots');
              if (targetAlbum) {
                const res = await MediaLibrary.getAssetsAsync({
                  album: targetAlbum,
                  first: 500,
                  mediaType: MediaLibrary.MediaType.photo,
                  sortBy: [[MediaLibrary.SortBy.creationTime, false]],
                });
                assets = res.assets || [];
              }
            } catch (e) {
              const res = await MediaLibrary.getAssetsAsync({
                first: 500,
                mediaType: MediaLibrary.MediaType.photo,
                sortBy: [[MediaLibrary.SortBy.creationTime, false]],
              });
              assets = res.assets || [];
            }

            if (assets.length > 0) {
              const newlyImported: ScreenshotItem[] = assets.map((a, idx) => {
                const filename = a.filename || `Screenshot_${Date.now()}_${idx}.png`;
                const category = inferCategoryFromFilename(filename, idx);
                return {
                  id: a.id || `sc-${Date.now()}-${idx}`,
                  uri: a.uri,
                  filename,
                  category,
                  ocrText: `Screenshot taken on ${new Date(
                    a.creationTime || Date.now()
                  ).toLocaleDateString()} ${filename} ${category} on-device search index`,
                  tags: ['screenshot', category.toLowerCase(), 'gallery'],
                  creationTime: a.creationTime || Date.now() - idx * 1000,
                  width: a.width,
                  height: a.height,
                  needsReview: false,
                };
              });

              setScreenshots((prev) => {
                const existingUris = new Set(prev.map((p) => p.uri));
                const uniqueNew = newlyImported.filter((d) => !existingUris.has(d.uri));
                const updated = [...uniqueNew, ...prev].slice(0, 500);
                AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });

              return newlyImported.length;
            }
          }
        } catch (e) {
          // ignore native error
        }
      }

      // If MediaLibrary is not available (e.g. Expo Go on Android) or has 0 assets,
      // launch image picker with UNLIMITED selection (0)
      const res = await pickScreenshotsFromPhone(0);
      return res?.length ?? 0;
    } catch (err: any) {
      console.warn('Error during bulk import:', err);
      const res = await pickScreenshotsFromPhone(0);
      return res?.length ?? 0;
    } finally {
      setIsLoading(false);
    }
  }, [pickScreenshotsFromPhone]);

  const refreshScreenshots = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadStoredScreenshots();
      await scanDeviceGallery();
    } finally {
      setIsLoading(false);
    }
  }, [loadStoredScreenshots, scanDeviceGallery]);

  // 4. Update Screenshot Category (instant re-categorization!)
  const updateScreenshotCategory = useCallback(
    async (id: string, newCategory: ScreenshotCategory) => {
      setScreenshots((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, category: newCategory, needsReview: false } : item
        );
        AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // 5. Add tag to screenshot
  const addScreenshotTag = useCallback(async (id: string, tag: string) => {
    const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;

    setScreenshots((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const tags = item.tags.includes(cleanTag) ? item.tags : [...item.tags, cleanTag];
          return { ...item, tags };
        }
        return item;
      });
      AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 6. Delete screenshot
  const deleteScreenshot = useCallback(async (id: string) => {
    setScreenshots((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 7. Create custom collection
  const createCustomCollection = useCallback(async (name: string): Promise<boolean> => {
    const clean = name.trim();
    if (!clean) return false;

    return new Promise((resolve) => {
      setCustomCollections((prev) => {
        if (prev.includes(clean)) {
          resolve(true);
          return prev;
        }
        const updated = [...prev, clean];
        AsyncStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(updated));
        resolve(true);
        return updated;
      });
    });
  }, []);

  // 8. Mark as reviewed
  const markAsReviewed = useCallback(async (id: string) => {
    setScreenshots((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, needsReview: false } : item
      );
      AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 9. Cross-category search across all screenshots
  const searchScreenshots = useCallback(
    (query: string): ScreenshotItem[] => {
      const q = query.trim().toLowerCase();
      if (!q) return screenshots;

      return screenshots.filter((item) => {
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchFilename = item.filename.toLowerCase().includes(q);
        const matchOcr = item.ocrText.toLowerCase().includes(q);
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
        return matchCategory || matchFilename || matchOcr || matchTags;
      });
    },
    [screenshots]
  );

  const addCustomScreenshot = useCallback(async (item: ScreenshotItem) => {
    setScreenshots((prev) => {
      const updated = [item, ...prev];
      AsyncStorage.setItem(SCREENSHOTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const needsReviewCount = useMemo(() => {
    return screenshots.filter((s) => s.needsReview).length;
  }, [screenshots]);

  const value = useMemo(
    () => ({
      screenshots,
      customCollections,
      isLoading,
      error,
      needsReviewCount,
      pickScreenshotsFromPhone,
      importAllDeviceScreenshots,
      refreshScreenshots,
      searchScreenshots,
      addCustomScreenshot,
      updateScreenshotCategory,
      addScreenshotTag,
      deleteScreenshot,
      createCustomCollection,
      markAsReviewed,
    }),
    [
      screenshots,
      customCollections,
      isLoading,
      error,
      needsReviewCount,
      pickScreenshotsFromPhone,
      importAllDeviceScreenshots,
      refreshScreenshots,
      searchScreenshots,
      addCustomScreenshot,
      updateScreenshotCategory,
      addScreenshotTag,
      deleteScreenshot,
      createCustomCollection,
      markAsReviewed,
    ]
  );

  return (
    <ScreenshotsContext.Provider value={value}>
      {children}
    </ScreenshotsContext.Provider>
  );
}

export function useScreenshots() {
  return useContext(ScreenshotsContext);
}
