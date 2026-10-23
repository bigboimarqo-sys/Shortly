/**
 * Shotly AI Service
 * 
 * Provides intelligent on-device AI assistance throughout the app:
 * - Smart Screenshot Summarization
 * - Semantic Entity & Action Extraction (OTP, URLs, Amounts in ZAR, Phone numbers, Reference codes)
 * - Natural Language Screenshot Q&A
 * - Global AI Library Search ("Find my Wi-Fi password", "All Takealot receipts")
 * - Smart Auto-Tagging & Categorization
 * - 24/7 Live AI Customer Support Knowledge Engine
 * 
 * Strict Privacy: All screenshot OCR analysis is executed on-device with ZERO
 * screenshot image or OCR text transmission to external third-party SDKs.
 */

export interface SmartAction {
  id: string;
  type: 'otp' | 'url' | 'phone' | 'email' | 'amount' | 'ref' | 'date';
  label: string;
  value: string;
  icon: string;
  actionType: 'copy' | 'open_url' | 'call' | 'mail' | 'calendar';
}

export interface AIScreenshotInsight {
  summary: string;
  smartActions: SmartAction[];
  suggestedTags: string[];
  keyFacts: { label: string; value: string }[];
}

export interface AISearchMatch {
  screenshotId: string;
  answerSnippet: string;
  confidence: number;
}

export interface SupportChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  actionLink?: {
    type: 'paywall' | 'permissions' | 'settings' | 'collections' | 'clean_up';
    label: string;
  };
}

export class AIService {
  /**
   * 1. Smart Screenshot Analysis (Summary, Smart Actions, Tags, Key Facts)
   */
  static analyzeScreenshot(
    ocrText: string,
    category: string,
    filename: string
  ): AIScreenshotInsight {
    const text = ocrText || '';
    const lower = text.toLowerCase();
    const actions: SmartAction[] = [];
    const keyFacts: { label: string; value: string }[] = [];
    const suggestedTags: string[] = [];

    // --- Entity Extraction ---

    // A. South African Rand Amounts (e.g. R 450.00, R450, ZAR 1,200.50)
    const amountRegex = /(?:R|ZAR)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?)/gi;
    const amounts = Array.from(text.matchAll(amountRegex));
    if (amounts.length > 0) {
      const topAmount = amounts[0][0].replace(/\s+/g, ' ');
      actions.push({
        id: 'action-amount-1',
        type: 'amount',
        label: `Copy ${topAmount}`,
        value: topAmount,
        icon: '💰',
        actionType: 'copy',
      });
      keyFacts.push({ label: 'Total / Amount', value: topAmount });
      suggestedTags.push('Receipt', 'Expense');
    }

    // B. One-Time Passwords / Verification Codes (e.g. OTP: 493012, code is 123456)
    const otpRegex = /\b(?:otp|code|pin|verification)\b[^\d]{0,8}(\d{4,8})\b/i;
    const otpMatch = text.match(otpRegex);
    if (otpMatch && otpMatch[1]) {
      actions.push({
        id: 'action-otp-1',
        type: 'otp',
        label: `Copy OTP: ${otpMatch[1]}`,
        value: otpMatch[1],
        icon: '🔐',
        actionType: 'copy',
      });
      keyFacts.push({ label: 'Security Code', value: otpMatch[1] });
      suggestedTags.push('OTP', 'Auth');
    }

    // C. URLs / Web links
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|co\.za|org|io|net|app)(?:\/[^\s]*)?)/gi;
    const urlMatches = Array.from(text.matchAll(urlRegex));
    if (urlMatches.length > 0) {
      const rawUrl = urlMatches[0][0];
      const validUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      actions.push({
        id: 'action-url-1',
        type: 'url',
        label: `Visit Link`,
        value: validUrl,
        icon: '🌐',
        actionType: 'open_url',
      });
      suggestedTags.push('Web');
    }

    // D. South African Phone Numbers / Cell numbers (+27 or 082/072/061/etc)
    const phoneRegex = /(?:\+27|0)[6-8][0-9]{1}[\s-]?[0-9]{3}[\s-]?[0-9]{4}/g;
    const phoneMatches = Array.from(text.matchAll(phoneRegex));
    if (phoneMatches.length > 0) {
      const phone = phoneMatches[0][0];
      actions.push({
        id: 'action-phone-1',
        type: 'phone',
        label: `Contact ${phone}`,
        value: phone,
        icon: '📞',
        actionType: 'call',
      });
      keyFacts.push({ label: 'Phone Number', value: phone });
      suggestedTags.push('Contact');
    }

    // E. Emails
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatches = Array.from(text.matchAll(emailRegex));
    if (emailMatches.length > 0) {
      const email = emailMatches[0][0];
      actions.push({
        id: 'action-email-1',
        type: 'email',
        label: `Email ${email}`,
        value: email,
        icon: '✉️',
        actionType: 'mail',
      });
      keyFacts.push({ label: 'Email Address', value: email });
    }

    // F. Reference / Order / Tracking Numbers
    const refRegex = /\b(?:ref|reference|order|tracking|account|inv|invoice)\s*(?:no|#|num)?[:.\s]*([A-Z0-9-]{5,20})\b/i;
    const refMatch = text.match(refRegex);
    if (refMatch && refMatch[1]) {
      actions.push({
        id: 'action-ref-1',
        type: 'ref',
        label: `Copy Ref: ${refMatch[1]}`,
        value: refMatch[1],
        icon: '🔖',
        actionType: 'copy',
      });
      keyFacts.push({ label: 'Reference #', value: refMatch[1] });
      suggestedTags.push('Order');
    }

    // --- Generate Concise AI Summary ---
    let summary = '';
    if (lower.includes('invoice') || lower.includes('receipt') || lower.includes('vat') || category === 'Receipts') {
      const vendorMatch = text.match(/(?:from|merchant|store|shop|at)\s+([A-Za-z0-9\s&]{3,24})/i);
      const vendor = vendorMatch ? vendorMatch[1].trim() : (category || 'Receipt');
      summary = amounts.length > 0 
        ? `${vendor} receipt with total amount of ${amounts[0][0]}.` 
        : `Transaction receipt from ${vendor}.`;
    } else if (otpMatch) {
      summary = `Authentication message with verification code ${otpMatch[1]}.`;
    } else if (category === 'Chats' || lower.includes('message') || lower.includes('today at') || lower.includes('yesterday')) {
      summary = `Chat screenshot containing conversation notes and exchanged messages.`;
    } else if (category === 'Work' || lower.includes('meeting') || lower.includes('agenda') || lower.includes('project')) {
      summary = `Work document detailing project agenda and professional correspondence.`;
    } else if (category === 'Tickets' || lower.includes('flight') || lower.includes('gate') || lower.includes('seat')) {
      summary = `Travel booking or admission ticket with itinerary credentials.`;
    } else if (category === 'Finance' || lower.includes('bank') || lower.includes('transfer') || lower.includes('payment')) {
      summary = `Banking confirmation notice or electronic payment receipt.`;
    } else if (text.trim().length > 0) {
      const cleanSnippet = text.replace(/[\r\n]+/g, ' ').slice(0, 100).trim();
      summary = `Screenshot with extracted text: "${cleanSnippet}..."`;
    } else {
      summary = `Visual screenshot (${category || 'General'}) with minimal legible text.`;
    }

    // Default suggestions if list is sparse
    if (suggestedTags.length === 0) {
      suggestedTags.push(category, 'QuickSave');
    }

    return {
      summary,
      smartActions: actions,
      suggestedTags: Array.from(new Set(suggestedTags)).slice(0, 4),
      keyFacts,
    };
  }

  /**
   * 2. Natural Language Question Answering over a single screenshot
   */
  static askScreenshot(
    question: string,
    ocrText: string,
    category: string
  ): string {
    const q = question.toLowerCase().trim();
    const text = ocrText || '';
    const lower = text.toLowerCase();

    if (!text.trim()) {
      return "I couldn't detect legible text in this screenshot to answer your question. You can try adjusting the crop or contrast.";
    }

    // Price / Cost / Total
    if (q.includes('how much') || q.includes('price') || q.includes('cost') || q.includes('total') || q.includes('amount')) {
      const match = text.match(/(?:R|ZAR)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?)/i);
      if (match) {
        return `Based on the screenshot, the total amount identified is ${match[0]}.`;
      }
      return "I couldn't locate a clear currency or total amount formatted in R (ZAR) in this image.";
    }

    // OTP / Code / Password
    if (q.includes('code') || q.includes('otp') || q.includes('password') || q.includes('pin')) {
      const match = text.match(/\b(?:otp|code|pin|password)[^\d]{0,8}(\d{4,8})\b/i);
      if (match) {
        return `The security code or OTP found in this screenshot is ${match[1]}.`;
      }
      const numbers = text.match(/\b\d{4,6}\b/);
      if (numbers) {
        return `I found the number ${numbers[0]}, which might be the code or verification PIN.`;
      }
      return "I couldn't find a one-time password or security pin in this screenshot.";
    }

    // Date / Time
    if (q.includes('date') || q.includes('when') || q.includes('time')) {
      const dateMatch = text.match(/\b(?:\d{1,2}[-\/.]\d{1,2}[-\/.](?:\d{2}|\d{4})|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i);
      if (dateMatch) {
        return `The date shown on this screenshot is ${dateMatch[0]}.`;
      }
      return "I couldn't detect an explicit date string formatted in this screenshot.";
    }

    // Who / Sender / Store
    if (q.includes('who') || q.includes('store') || q.includes('vendor') || q.includes('sender') || q.includes('company')) {
      const firstLine = text.split('\n')[0]?.trim() || '';
      return `The primary header or merchant text identified at the top is: "${firstLine}".`;
    }

    // General Summary
    if (q.includes('summary') || q.includes('what is this') || q.includes('explain')) {
      const insight = this.analyzeScreenshot(ocrText, category, '');
      return insight.summary;
    }

    // Keyword Search within OCR text
    const words = q.split(/\s+/).filter(w => w.length > 3 && !['what', 'when', 'where', 'which', 'there', 'about'].includes(w));
    for (const w of words) {
      if (lower.includes(w)) {
        const idx = lower.indexOf(w);
        const snippet = text.slice(Math.max(0, idx - 40), Math.min(text.length, idx + 80)).replace(/\n/g, ' ');
        return `Found match for "${w}": "...${snippet}..."`;
      }
    }

    return `The screenshot contains text related to ${category}. Here is an excerpt: "${text.slice(0, 120)}..."`;
  }

  /**
   * 3. AI Semantic Search across all screenshots in user's library
   */
  static searchLibraryWithAI(
    query: string,
    screenshots: { id: string; filename: string; category: string; ocrText: string }[]
  ): {
    bestAnswer: string;
    matchingScreenshots: { id: string; snippet: string; reason: string }[];
  } {
    const q = query.toLowerCase().trim();
    const results: { id: string; snippet: string; reason: string }[] = [];

    for (const s of screenshots) {
      const ocrLower = (s.ocrText || '').toLowerCase();
      let matched = false;
      let reason = '';

      if (q.includes('wifi') || q.includes('wi-fi') || q.includes('password')) {
        if (ocrLower.includes('wifi') || ocrLower.includes('wi-fi') || ocrLower.includes('password') || ocrLower.includes('ssid')) {
          matched = true;
          reason = 'Contains network credentials / Wi-Fi details';
        }
      } else if (q.includes('receipt') || q.includes('invoice') || q.includes('paid') || q.includes('cost')) {
        if (s.category === 'Receipts' || ocrLower.includes('r') || ocrLower.includes('total') || ocrLower.includes('invoice')) {
          matched = true;
          reason = 'Matches receipt or transaction records';
        }
      } else if (q.includes('otp') || q.includes('code') || q.includes('bank')) {
        if (ocrLower.includes('otp') || ocrLower.includes('code') || ocrLower.includes('fnb') || ocrLower.includes('capitec') || ocrLower.includes('standard bank') || ocrLower.includes('absa')) {
          matched = true;
          reason = 'Matches authentication or banking screenshot';
        }
      } else {
        // Broad substring match
        const terms = q.split(' ').filter(t => t.length > 2);
        const hit = terms.some(t => ocrLower.includes(t) || s.category.toLowerCase().includes(t));
        if (hit) {
          matched = true;
          reason = `Matches search terms (${q})`;
        }
      }

      if (matched) {
        const snippet = (s.ocrText || s.filename).slice(0, 80).replace(/\n/g, ' ');
        results.push({
          id: s.id,
          snippet: snippet || s.filename,
          reason,
        });
      }
    }

    let bestAnswer = '';
    if (results.length > 0) {
      bestAnswer = `Found ${results.length} screenshot${results.length === 1 ? '' : 's'} relevant to "${query}".`;
    } else {
      bestAnswer = `No direct match found for "${query}" in your analyzed screenshots. Try searching for specific keywords or vendor names.`;
    }

    return {
      bestAnswer,
      matchingScreenshots: results.slice(0, 10),
    };
  }

  /**
   * 4. 24/7 Live AI Customer Support Assistant Response Engine
   */
  static generateSupportResponse(userMessage: string): SupportChatMessage {
    const msg = userMessage.toLowerCase().trim();
    let text = '';
    let actionLink: SupportChatMessage['actionLink'] = undefined;

    // A. Pricing / Cost / Plans in ZAR
    if (msg.includes('price') || msg.includes('cost') || msg.includes('zar') || msg.includes('rand') || msg.includes('how much') || msg.includes('plan') || msg.includes('plus') || msg.includes('free') || msg.includes('subscription') || msg.includes('model')) {
      text = `Here is Shotly's full Subscription Model for South Africa (ZAR):
• Free: R0 (Auto-capture, OCR search, 100 screenshots limit, runs for 7 days)
• Plus: R39 / month or R349 / year (Unlimited library, clean-up, Private Vault)
• Pro: R79 / month or R699 / year (Cloud sync, Receipt Tracker, Smart Actions)
• Team: R149 / month, 5 seats (Pro plus shared collections)

All paid plans include a 7-day free trial on Card (Visa/Mastercard) and digital wallets (Apple Pay, Google Pay, Samsung Pay). Cancel anytime!`;
      actionLink = { type: 'paywall', label: 'View Subscription Model' };
    }
    // B. Free Trial, Duration & Cancellation
    else if (msg.includes('trial') || msg.includes('cancel') || msg.includes('refund') || msg.includes('7 day') || msg.includes('7-day') || msg.includes('expire') || msg.includes('expiry') || msg.includes('duration')) {
      text = `Here is how trials and billing durations work on Shotly:
• Free Mode: The Free plan runs for 7 days with a limit of 100 screenshots.
• Paid Plans Trial: 7-day free trial on Plus, Pro, and Team plans with full features.
• Full Duration Added: When you start an annual or monthly subscription, your 7-day free trial is added to the full billing period. For example, subscribing to Pro Annual (R699/year) gives you 7 days trial + 1 full year (expiring exactly 1 year after the trial ends, e.g., 30 October 2027). For monthly plans, it is 7 days trial + 1 month.
• You won't be charged today. First billing occurs on day 7, and you can cancel anytime before then with zero penalty.`;
      actionLink = { type: 'settings', label: 'Manage Subscription in Settings' };
    }
    // C. Privacy & Security
    else if (msg.includes('privacy') || msg.includes('safe') || msg.includes('secure') || msg.includes('cloud') || msg.includes('server') || msg.includes('data')) {
      text = `Privacy is our #1 Hard Rule:
🔒 All screenshot images and OCR text stay strictly on your device.
🚫 No third-party SDK or cloud service ever receives your screenshot pixels or extracted text.
💳 Payment details (card numbers, CVVs) are processed directly by certified providers and are never stored in Shotly.`;
      actionLink = { type: 'settings', label: 'Review Privacy & Security' };
    }
    // D. Permissions & Photo Access
    else if (msg.includes('permission') || msg.includes('access') || msg.includes('empty') || msg.includes('not showing') || msg.includes('import') || msg.includes('gallery')) {
      text = `To auto-import and scan your screenshots, Shotly needs Media Library access:
1. Tap the button below to review your permissions.
2. Grant "Full Access" or "All Photos" to let Shotly detect screenshots.
3. Once granted, Shotly reads text on-device using high-speed offline OCR!`;
      actionLink = { type: 'permissions', label: 'Check Storage Permissions' };
    }
    // E. How OCR Search works
    else if (msg.includes('search') || msg.includes('find') || msg.includes('ocr') || msg.includes('text')) {
      text = `Shotly automatically performs on-device OCR on every screenshot. You can:
• Type any word visible in an image into the search bar (e.g., store name, account number, OTP).
• Filter by 10 smart categories like Receipts, Tickets, Chats, Finance, and Work.
• Use AI Search to ask natural questions like "Find my Wi-Fi password"!`;
      actionLink = { type: 'collections', label: 'Explore Collections' };
    }
    // F. Collections & Tags
    else if (msg.includes('collection') || msg.includes('tag') || msg.includes('folder') || msg.includes('organize')) {
      text = `You can organize screenshots with custom Collections and Tags:
• Free tier includes up to 3 custom collections.
• Shotly Plus unlocks unlimited collections and tags.
• You can also use AI Auto-Tagging on any screenshot to tag it with 1 tap!`;
      actionLink = { type: 'collections', label: 'Open Collections' };
    }
    // G. Clean-Up & Duplicates
    else if (msg.includes('clean') || msg.includes('duplicate') || msg.includes('storage') || msg.includes('delete') || msg.includes('space')) {
      text = `Our Clean-Up tool helps you free up phone space by identifying:
• Duplicate and near-duplicate screenshots
• Expired OTPs and temporary authentication codes
• Blurry or old memes
You can swipe to review and delete them safely!`;
      actionLink = { type: 'clean_up', label: 'Open Clean-Up Tool' };
    }
    // H. Payment Methods (Apple Pay, Google Pay, Samsung Pay, PayFast)
    else if (msg.includes('payfast') || msg.includes('google pay') || msg.includes('apple pay') || msg.includes('samsung pay') || msg.includes('payment method')) {
      text = `Shotly supports safe and convenient South African payment methods:
• Card (Visa, Mastercard)
• Google Pay (for Android)
• Apple Pay (for iPhone)
• Samsung Pay (for Galaxy devices)
• PayFast (South Africa's leading payment gateway)
Note: Instant EFT is not supported for free trials.`;
      actionLink = { type: 'paywall', label: 'Choose Payment Method' };
    }
    // I. Name & Identity ("Who are you?", "What's your name?", "Marcus")
    else if (msg.includes('who are you') || msg.includes('your name') || msg.includes('what is your name') || msg.includes('marcus') || msg.includes('who made you')) {
      text = `I'm Marcus, your dedicated 24/7 AI Assistant for Shotly!
I'm built right into the app to help you:
• Search & understand your screenshots using on-device OCR
• Answer questions about receipts, documents, and OTPs
• Guide you with subscription plans in ZAR (R349/year, R39/month)
• Safeguard your 100% on-device privacy guarantee

How can I help you today?`;
    }
    // Default empathetic greeting & options
    else {
      text = `Hello! I'm Marcus, your Shotly 24/7 AI Support Assistant. 
I can help you with:
• Subscription plans & 7-day free trial (R349/year, R39/month in ZAR)
• On-device OCR text search & AI screenshot queries
• Photo & storage permissions troubleshooting
• Privacy guarantees & zero cloud storage
• Creating Collections & cleaning duplicate screenshots

How can I help you right now?`;
    }

    return {
      id: `ai-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sender: 'ai',
      text,
      timestamp: Date.now(),
      actionLink,
    };
  }
}
