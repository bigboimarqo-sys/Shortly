# Shotly Production Go-Live Checklist

This checklist tracks all credentials, backend proxies, API keys, store configurations, and verified features required for **Shotly** (v1.0 MVP).

---

## 1. AI Assistant & Customer Support ("Marcus")

### A. Gemini API Key & Supabase Edge Function Proxy
- [ ] **Generate Gemini API Key**:
  - Get free key from [Google AI Studio](https://aistudio.google.com/apikey).
- [x] **Build Supabase Edge Function Proxy**:
  - Created `supabase/functions/ai-support/index.ts` with CORS, token limits, system prompt for South African pricing/Shotly features, and safe error handling.
  - Client wired in `src/services/ai-service.ts` with on-device offline fallback engine.
  - Deploy with:
  ```bash
  npx supabase secrets set GEMINI_API_KEY=your_key --project-ref ikhdphbdswvhadehucyr
  npx supabase functions deploy ai-support --no-verify-jwt --project-ref ikhdphbdswvhadehucyr
  ```
- [x] **Strict Privacy Rule Verification**:
  - Verified that only user customer support text questions are sent to the AI endpoint.
  - User screenshot images and OCR text stay **100% on the device** and are NEVER transmitted to external LLMs.

---

## 2. In-App Purchases & Paywall (Store Billing)

### A. RevenueCat Setup
- [x] Create a project on [RevenueCat Dashboard](https://app.revenuecat.com/) (Project created).
- [x] Add iOS App (Apple App Store) with Bundle ID: `com.shotly.app` (configured in `app.json`).
- [x] Add Android App (Google Play) with Package Name: `com.shotly.app` (configured in `app.json`).
- [x] Install SDK: `npx expo install react-native-purchases` *(Installed v11.0.1)*.
- [x] Configure RevenueCat Service: `src/services/revenuecat-service.ts` wired to `SubscriptionContext` & `PaywallModal`.
- [ ] Set your actual production API keys in `.env` and EAS Secrets:
  ```env
  EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_your_apple_api_key_here
  EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_your_google_api_key_here
  ```

### B. Product & Entitlement IDs (Exact ZAR Pricing)
Set up these exact product identifiers in App Store Connect & Google Play Console:
- [ ] **`plus_monthly`**: `R39.00` / month (7-day free trial)
- [ ] **`plus_annual`**: `R349.00` / year (7-day free trial)
- [ ] **`pro_monthly`**: `R79.00` / month (7-day free trial)
- [ ] **`pro_annual`**: `R699.00` / year (7-day free trial)
- [ ] **`team_monthly`**: `R149.00` / month (5 seats, 7-day free trial)
- [ ] Attach all products to the **`plus`** entitlement in RevenueCat (under *Entitlements* -> `plus`).
- [ ] Configure Offering: Create an offering named `default` and attach packages for each product.

### C. Store Compliance Checks
- [x] Paywall clearly displays:
  - 7-day free trial terms.
  - Price in South African Rand (ZAR).
  - Prominent **Restore purchases** button.
  - Links to **Terms of Service** and **Privacy Policy**.
- [x] Sandbox test all four states: Success, Bank Declined, User Cancelled, Network Failed.

---

## 3. Backend & Authentication (Supabase)

- [x] **Supabase Production Project**:
  - Current Endpoint: `https://ikhdphbdswvhadehucyr.supabase.co`
- [x] **Authentication Settings & Deep Linking**:
  - Add App Redirect URLs for deep linking: `shortly://auth/callback` handled in `src/context/auth-context.tsx`.
- [x] **Mandatory Registration / Authentication**:
  - Guest mode bypass is disabled: users must register or sign in.
  - Activates 7-day free trial (up to 100 screenshots during trial).
- [x] **In-App Password Reset Flow**:
  - Integrated `resetPassword()` calling `supabase.auth.resetPasswordForEmail()` with a dedicated modal in `SignInView`.

---

## 4. Native Permissions & On-Device OCR

### A. App Permissions (`app.json`)
- [x] iOS: Configured `NSPhotoLibraryUsageDescription` in `app.json`.
- [x] Android: Configured `READ_MEDIA_IMAGES` and `READ_EXTERNAL_STORAGE` in `app.json`.

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
- [x] Splash Screens: Light and dark mode support (`AnimatedSplashOverlay` with Space Grotesk font loading).
- [ ] Screenshots: 6.7" iPhone & 12.9" iPad, 1080x1920 Android phone & tablet.
- [ ] Age Rating: Complete questionnaire (12+ recommended due to device photo scanning).
- [x] In-App Privacy Policy & Terms: Full legal text with POPIA compliance rendered in `PrivacyPolicyModal` & hosted URL fallback.

---

## 7. Core MVP Features & Screen Polish (Verified)

- [x] **Paywall**: 7-day free trial, ZAR pricing (Plus R39/mo, R349/yr, Pro R79/mo), RevenueCat fallback, interactive sandbox tester.
- [x] **Clean-Up Swipe Review**: Tinder-style swipe review (Right = Keep, Left = Delete), OS photo library deletion permission toggle, and real-time MB freed counter.
- [x] **Native Screenshot Sharing**: Shares actual image files via native share sheet (`expo-sharing` via device cache) with Web Blob download fallback.
- [x] **Collections & Tags**: 3-collection limit on Free tier, visual image preview covers, custom collection creation, tag filtering.
- [x] **Dark Mode Theme Engine**: Persistent Theme Provider (`src/context/theme-context.tsx`) with AsyncStorage persistence (`@shotly_appearance_preference`), re-theming light/dark across all components.
- [x] **Reusable Empty States**: `EmptyState` component integrated across Library, Collections, and queues.
- [x] **Settings Modals**: Interactive modals for Appearance, About Shotly (v1.0.0 Build 42), and 10 Categories breakdown.
