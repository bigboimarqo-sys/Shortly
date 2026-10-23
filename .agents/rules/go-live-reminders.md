# Rule: Go-Live & Production API Reminders

## Persistent Reminder Trigger
Whenever the user asks about going live, finishing the build, testing payments, deployment, environment variables, or when completing major milestone phases:

1. **Remind the user of the Go-Live Checklist** ([`docs/GO_LIVE_CHECKLIST.md`](file:///c:/Users/Office/Documents/Shortly/docs/GO_LIVE_CHECKLIST.md)):
   - **`GEMINI_API_KEY` Proxy**: Remind that `GEMINI_API_KEY` must be deployed on a lightweight backend proxy (e.g., Supabase Edge Function `ai-support`), NEVER exposed directly in client source code.
   - **Privacy Rule**: Remind that Marcus only handles customer support chat; user screenshots and OCR text must NEVER be uploaded to external AI services.
   - **RevenueCat Keys**: Remind that `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` and `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY` need to be set with ZAR store products matching our 4-tier model.
   - **Offline-First Gate**: Remind that all core v1.0 features (scanning, search, categories, clean-up) must work in airplane mode with 0 connection.
   - **Store Compliance**: Remind that Restore purchases, Terms, and Privacy Policy links must remain visible on the paywall.
