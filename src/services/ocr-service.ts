import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import { Platform } from 'react-native';

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

const ROTATING_CATEGORIES: ScreenshotCategory[] = [
  'Receipts',
  'Recipes',
  'Work',
  'Tickets',
  'Chats',
  'Maps',
];

export class OcrService {
  /**
   * Check if native OCR is supported on this platform/environment
   */
  static isOcrAvailable(): boolean {
    if (Platform.OS === 'web') return false;
    return !!isSupported;
  }

  /**
   * Run on-device OCR (Apple Vision on iOS, Google ML Kit on Android)
   * Hard Rule: All OCR is 100% on-device. Zero network requests. Never log extracted text.
   */
  static async extractText(uri: string): Promise<string> {
    if (!this.isOcrAvailable() || !uri) {
      return '';
    }

    try {
      const blocks = await extractTextFromImage(uri);
      if (Array.isArray(blocks) && blocks.length > 0) {
        return blocks
          .map((b) => (typeof b === 'string' ? b.trim() : ''))
          .filter(Boolean)
          .join('\n');
      }
      return '';
    } catch (err) {
      // Graceful fallback if image format is unsupported or native engine fails
      return '';
    }
  }

  /**
   * Smart category detection combining OCR text content and filename
   */
  static categorize(
    filename: string,
    ocrText: string = '',
    fallbackIndex: number = 0
  ): ScreenshotCategory {
    const combined = `${filename} \n ${ocrText}`.toLowerCase();

    // 1. Receipts / Invoices / Proof of Payment
    if (
      combined.includes('receipt') ||
      combined.includes('tax invoice') ||
      combined.includes('vat invoice') ||
      combined.includes('proof of payment') ||
      combined.includes('payment successful') ||
      combined.includes('subtotal') ||
      combined.includes('total: r') ||
      combined.includes('total due') ||
      combined.includes('amount paid') ||
      combined.includes('woolworths') ||
      combined.includes('checkers') ||
      combined.includes('pick n pay') ||
      combined.includes('spar') ||
      combined.includes('card ending') ||
      combined.includes('tax no') ||
      combined.includes('merchant id') ||
      combined.includes('order summary') ||
      combined.includes('uber eats') ||
      combined.includes('mr d food')
    ) {
      return 'Receipts';
    }

    // 2. Recipes & Food
    if (
      combined.includes('recipe') ||
      combined.includes('ingredients') ||
      combined.includes('tablespoon') ||
      combined.includes('teaspoon') ||
      combined.includes('tbsp') ||
      combined.includes('tsp') ||
      combined.includes('prep time') ||
      combined.includes('cook time') ||
      combined.includes('servings:') ||
      combined.includes('instructions') ||
      combined.includes('preheat oven') ||
      combined.includes('bake at') ||
      combined.includes('simmer') ||
      combined.includes('pasta') ||
      combined.includes('salad') ||
      combined.includes('dinner')
    ) {
      return 'Recipes';
    }

    // 3. Work / Business / Analytics
    if (
      combined.includes('mrr') ||
      combined.includes('churn') ||
      combined.includes('quarterly growth') ||
      combined.includes('sprint') ||
      combined.includes('roadmap') ||
      combined.includes('dashboard') ||
      combined.includes('active users') ||
      combined.includes('slack') ||
      combined.includes('figma') ||
      combined.includes('jira') ||
      combined.includes('pull request') ||
      combined.includes('github') ||
      combined.includes('meeting notes') ||
      combined.includes('agenda') ||
      combined.includes('spreadsheet') ||
      combined.includes('presentation')
    ) {
      return 'Work';
    }

    // 4. Tickets / Boarding Passes / Travel Passes
    if (
      combined.includes('boarding pass') ||
      combined.includes('flight') ||
      combined.includes('gate ') ||
      combined.includes('seat ') ||
      combined.includes('departure') ||
      combined.includes('booking reference') ||
      combined.includes('booking ref') ||
      combined.includes('flysafair') ||
      combined.includes('airlink') ||
      combined.includes('computicket') ||
      combined.includes('ticketmaster') ||
      combined.includes('eticket') ||
      combined.includes('seat:') ||
      combined.includes('row:')
    ) {
      return 'Tickets';
    }

    // 5. Chats & Messaging
    if (
      combined.includes('whatsapp') ||
      combined.includes('messages') ||
      combined.includes('imessage') ||
      combined.includes('telegram') ||
      combined.includes('typing...') ||
      combined.includes('today at') ||
      combined.includes('yesterday at') ||
      combined.includes('online') ||
      combined.includes('read by') ||
      combined.includes('group info')
    ) {
      return 'Chats';
    }

    // 6. Maps & Directions
    if (
      combined.includes('google maps') ||
      combined.includes('apple maps') ||
      combined.includes('waze') ||
      combined.includes('directions') ||
      combined.includes('fastest route') ||
      combined.includes('mins drive') ||
      combined.includes('meters away') ||
      combined.includes('turn right') ||
      combined.includes('turn left') ||
      combined.includes('destination') ||
      combined.includes('location pin')
    ) {
      return 'Maps';
    }

    // 7. Finance & Investments
    if (
      combined.includes('portfolio') ||
      combined.includes('cryptocurrency') ||
      combined.includes('bitcoin') ||
      combined.includes('ethereum') ||
      combined.includes('easyequities') ||
      combined.includes('shares') ||
      combined.includes('dividend') ||
      combined.includes('nasdaq') ||
      combined.includes('jse') ||
      combined.includes('available balance') ||
      combined.includes('statement')
    ) {
      return 'Finance';
    }

    // 8. Travel & Accommodation
    if (
      combined.includes('hotel') ||
      combined.includes('airbnb') ||
      combined.includes('reservation') ||
      combined.includes('check-in') ||
      combined.includes('check-out') ||
      combined.includes('trip') ||
      combined.includes('itinerary') ||
      combined.includes('resort')
    ) {
      return 'Travel';
    }

    // 9. Fashion & Shopping
    if (
      combined.includes('zara') ||
      combined.includes('h&m') ||
      combined.includes('shein') ||
      combined.includes('asos') ||
      combined.includes('superbalist') ||
      combined.includes('size: ') ||
      combined.includes('cart') ||
      combined.includes('sneakers') ||
      combined.includes('apparel')
    ) {
      return 'Fashion';
    }

    // 10. Memes
    if (
      combined.includes('meme') ||
      combined.includes('nobody:') ||
      combined.includes('me trying to') ||
      combined.includes('when you') ||
      combined.includes('pov:') ||
      combined.includes('humor')
    ) {
      return 'Memes';
    }

    return ROTATING_CATEGORIES[fallbackIndex % ROTATING_CATEGORIES.length];
  }

  /**
   * Extract meaningful keyword tags from OCR text
   */
  static extractTags(ocrText: string, category: ScreenshotCategory): string[] {
    const tags = new Set<string>(['screenshot', category.toLowerCase()]);
    const lower = ocrText.toLowerCase();

    const candidates = [
      'woolworths',
      'checkers',
      'spar',
      'invoice',
      'receipt',
      'groceries',
      'safair',
      'flight',
      'ticket',
      'recipe',
      'dinner',
      'pasta',
      'salad',
      'figma',
      'slack',
      'metrics',
      'whatsapp',
      'family',
      'work',
      'uber',
      'directions',
      'map',
      'cape town',
      'johannesburg',
      'sandton',
      'durban',
      'parking',
      'wifi password',
      'proof of payment',
    ];

    for (const kw of candidates) {
      if (lower.includes(kw)) {
        tags.add(kw.replace(/\s+/g, '-'));
      }
    }

    return Array.from(tags).slice(0, 6);
  }
}
