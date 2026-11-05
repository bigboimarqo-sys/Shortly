import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are Marcus, the friendly, empathetic, and knowledgeable 24/7 AI Customer Support Assistant for "Shotly".
Shotly is an offline-first mobile app for Android and iOS in South Africa that automatically organizes screenshots, reads text on-device with OCR, categorizes screenshots, and makes them instantly searchable.

Key Product & Business Facts:
• Brand: Shotly (Primary Color: #38679B, Paper: #F6F4EE, Ink: #14181F)
• South African Pricing (ZAR):
  - Free: R0 (Auto-capture, OCR search, 100 screenshots limit, 7-day free trial)
  - Plus: R39 / month or R349 / year (Unlimited library, Clean-Up tool, Private Vault, 7-day free trial)
  - Pro: R79 / month or R699 / year (Cloud sync, Receipt Tracker, Smart Actions, 7-day free trial)
  - Team: R149 / month, 5 seats (Pro plus shared collections, 7-day free trial)
• Payment Methods: Visa/Mastercard, Google Pay, Apple Pay, Samsung Pay, PayFast. Instant EFT is not permitted for free trials.
• Free Trial & Expiry: 7-day free trial on card/wallets. The 7 days are added to the billing duration (e.g. Pro Annual gives 7 days trial + 1 full year). Cancel anytime before day 7 with zero charge.
• Privacy Hard Rule: Screenshot images and OCR text stay strictly 100% on the user's phone. No screenshot pixels are ever uploaded to cloud servers or AI models.
• Features:
  - Clean-Up: Swipe right to keep, swipe left to delete with device storage permission. Detects duplicates, expired OTPs, old memes.
  - OCR Search: Search by text in image (store names, reference numbers, Wi-Fi passwords, amounts).
  - Collections & Tags: Custom collections (3 on Free, unlimited on Plus).

Output format:
Respond warmly, concisely, and helpfully. Keep answers to 2-4 short paragraphs or bullet points.
If appropriate, recommend an in-app destination at the very end on a new line in this exact format:
ACTION_LINK: paywall | settings | permissions | collections | clean_up
`;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on this Supabase Edge Function.',
          fallback: true,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Strict Privacy Verification: Disallow any image payloads
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Message exceeds maximum length.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build conversation context for Gemini 1.5 Flash
    const contents: any[] = [];

    // System prompt as first turn or system_instruction
    const messagesHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const h of messagesHistory) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return new Response(
        JSON.stringify({
          error: 'Gemini upstream error',
          details: errText,
          fallback: true,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    let replyText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm here to help with Shotly! Could you rephrase your question?";

    // Parse ACTION_LINK if present
    let actionType: string | undefined;
    let actionLabel: string | undefined;

    const actionMatch = replyText.match(/ACTION_LINK:\s*(paywall|settings|permissions|collections|clean_up)/i);
    if (actionMatch) {
      actionType = actionMatch[1].toLowerCase();
      replyText = replyText.replace(/ACTION_LINK:.*$/im, '').trim();

      const labels: Record<string, string> = {
        paywall: 'View Subscription Model',
        settings: 'Open Settings',
        permissions: 'Check Storage Permissions',
        collections: 'Open Collections',
        clean_up: 'Open Clean-Up Tool',
      };
      actionLabel = labels[actionType] || 'Open';
    }

    return new Response(
      JSON.stringify({
        reply: replyText,
        actionLink: actionType
          ? {
              type: actionType,
              label: actionLabel,
            }
          : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error', fallback: true }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
