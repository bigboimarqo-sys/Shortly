# Shotly Production Go-Live Checklist

This checklist tracks all the credentials, backend proxies, API keys, and store configurations required before publishing **Shotly** to the Apple App Store and Google Play Store.

---

## 1. AI Assistant & Customer Support ("Marcus")

### A. Gemini API Key & Supabase Edge Function Proxy
- [ ] **Generate Gemini API Key**:
  - Get key from [Google AI Studio](https://aistudio.google.com/).
- [ ] **Deploy Supabase Edge Function Proxy**:
  - To keep the `GEMINI_API_KEY` hidden from the client bundle and prevent reverse engineering, deploy a lightweight proxy:
  ```bash
  # In project terminal:
  npx supabase functions new ai-support
  npx supabase secrets set GEMINI_API_KEY=your_actual_key_here
  npx supabase functions deploy ai-support
  ```
- [ ] **Strict Privacy Rule Verification**:
  - Verify that only user customer support text questions are sent to the AI endpoint.
  - User screenshot images and OCR text stay **100% on the device** and are NEVER transmitted to external LLMs.

---

## 2. In-App Purchases & Paywall (Store Billing)

### A. RevenueCat Setup
- [ ] Create a project on [RevenueCat Dashboard](https://app.revenuecat.com/).
- [ ] Add iOS App (Apple App Store) and Android App (Google Play).
- [ ] Install SDK: `npx expo install react-native-purchases`.
- [ ] Set environment variables in `.env`:
  ```env
  EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_...
  EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_...
  ```

### B. Product & Entitlement IDs (Exact ZAR Pricing)
Set up these exact product identifiers in App Store Connect & Google Play Console:
- [ ] **`plus_monthly`**: `R39.00` / month (7-day free trial)
- [ ] **`plus_annual`**: `R349.00` / year (7-day free trial)
- [ ] **`pro_monthly`**: `R79.00` / month (7-day free trial)
- [ ] **`pro_annual`**: `R699.00` / year (7-day free trial)
- [ ] **`team_monthly`**: `R149.00` / month (5 seats, 7-day free trial)
- [ ] Attach all products to the **`plus`** entitlement in RevenueCat.

### C. Store Compliance Checks
- [ ] Paywall clearly displays:
  - 7-day free trial terms.
  - Price in South African Rand (ZAR).
  - Prominent **Restore purchases** button.
  - Links to **Terms of Service** and **Privacy Policy**.
- [ ] Sandbox test all four states: Success, Bank Declined, User Cancelled, Network Failed.

---

## 3. Backend & Authentication (Supabase)

- [ ] **Supabase Production Project**:
  - Current Endpoint: `https://ikhdphbdswvhadehucyr.supabase.co`
- [ ] **Authentication Settings**:
  - Enable Email / Password and Magic Link in Supabase Auth Settings.
  - Add App Redirect URLs for deep linking: `shortly://auth/callback`.
- [ ] **Mandatory Registration / Authentication**:
  - Verify that guest mode bypass is completely disabled: users cannot skip auth.
  - Ensure all users must register or sign in to activate their 7-day free trial (up to 100 screenshots during trial).

---

## 4. Native Permissions & On-Device OCR

### A. App Permissions (`app.json`)
- [ ] iOS: Ensure `NSPhotoLibraryUsageDescription` is user-friendly:
  ```json
  "NSPhotoLibraryUsageDescription": "Shotly needs photo access to detect and organise your screenshots on-device."
  ```
- [ ] Android: Ensure `READ_MEDIA_IMAGES` and `READ_EXTERNAL_STORAGE` permissions are configured.

### B. Machine Learning OCR Bundling
- [ ] Standalone build includes Google ML Kit (Android) and Apple Vision (iOS) native binary assets.
- [ ] Test offline mode: Turn on airplane mode and verify OCR search runs with zero internet connection.

---

## 5. Telemetry & Crash Reporting

- [ ] **PostHog Analytics**:
  - Configure `POSTHOG_API_KEY` for tracking paywall impressions and conversions (without tracking screenshot images or personal data).
- [ ] **Crash Reporting**:
  - Configure Sentry DSN or Firebase Crashlytics for real-time error tracking on release builds.

---

## 6. App Store & Play Store Listing Assets

- [ ] App Icons: 1024x1024 PNG (no transparency).
- [ ] Splash Screens: Light and dark mode support.
- [ ] Screenshots: 6.7" iPhone & 12.9" iPad, 1080x1920 Android phone & tablet.
- [ ] Age Rating: Complete questionnaire (12+ recommended due to device photo scanning).
- [ ] Privacy Policy URL hosted at public domain (e.g. `https://shotly.app/privacy`).
