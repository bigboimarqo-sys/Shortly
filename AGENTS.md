# AGENTS.md: Shotly

Read this first. It is the entry point for AI coding agents and developers.

**Shotly** is a mobile app (Android and iOS) that auto-imports screenshots, reads their text on-device, categorises them and makes them searchable. Free tier plus Plus subscription at launch. Market: South Africa.

## Read these files (source of truth)
| File | What it covers |
|---|---|
| docs/PRODUCT.md | Product, users, value, launch, business context |
| docs/FEATURES.md | MVP features and scope (v1.0) |
| docs/DESIGN_MVP.md | Master MVP design spec: all 19 designs, flows, sheets, copy, accessibility |
| docs/SCREENS.md | The 12 screens, states, flows, links to designs |
| docs/DESIGN_SYSTEM.md | Colours, type, spacing, components, logo, accessibility |
| docs/ARCHITECTURE.md | Stack, pipeline, folders, rules, platform notes |
| docs/DATA_MODEL.md | SQLite schema, search index |
| docs/SUBSCRIPTIONS.md | Plans, entitlements, paywall rules |
| docs/PRIVACY_SECURITY.md | Privacy and security rules |
| docs/ROADMAP.md | 16-week plan and success targets |
| docs/TESTING.md | Test strategy, devices, performance gates |
| docs/ANALYTICS.md | Events and metrics |
| docs/TASKS.md | First two sprints of tasks |
| design-tokens.json | Machine-readable tokens |
| brand/ | Logos (SVG): icon, wordmark, dark wordmark, mono |

If code and docs disagree, ask the product owner. Do not change scope silently.

## Designs
- Screen designs (19 MVP designs incl. Splash, Sign in/up and Settings sheets, light mode): https://claude.ai/artifact/WgogXiWNhU7rbSfezQYKmB
- Not yet designed: dark mode, Clean-Up swipe review, Categories and About screens, forgot-password, empty and error states, widgets, app icon sizes (full list in docs/DESIGN_MVP.md). Build these from docs/DESIGN_SYSTEM.md and flag them for review.
- Investor deck (context only): https://claude.ai/artifact/X5VesyhcT6gbrgMVMoTNA8

## Brand quick reference
- Primary colour: **#38679B** (brand). Text on dark: #7FA6D1. Ink #14181F. Paper #F6F4EE. Surface #FFFFFF. Dark card #222A35. Muted #5D646C. Border #E0DDD3.
- Font: Space Grotesk (400, 500, 700), fallback Arial.
- Radius 8 / 12 / 16 / pill. Spacing 4, 8, 12, 16, 24, 32, 48. Min touch target 44px.
- Never hard-code colours, sizes or fonts; use the tokens.

## Stack (proposed defaults; confirm before scaffolding)
Flutter and Dart, Riverpod, go_router, Drift (SQLite with FTS5), photo_manager, ML Kit OCR (Android) and Apple Vision (iOS), local_auth, RevenueCat, PostHog and Crashlytics. Authentication is needed in the MVP (sign in and sign up; the app must still work without an account). Cloud sync of screenshots only from v1.2.

## Hard rules
1. **Privacy:** images and OCR text stay on the device. No SDK may receive screenshot content. Never log OCR text or file names.
2. **Offline-first:** every v1.0 feature works with no connection.
3. **Originals stay in the gallery.** Store asset ID, thumbnail and metadata only.
4. **Entitlements:** check plans only through `EntitlementService`.
5. **Layers:** no business logic in widgets; platform code behind interfaces.
6. **Design:** light and dark mode on every screen; accessible labels; 4.5:1 text contrast.
7. **Performance:** OCR under 1.5s per image (mid-range Android), 60fps at 10,000 items, supports Android 8+ and iOS 15+.

## MVP scope (v1.0)
In: splash, sign in and sign up (optional), auto-capture, bulk import, share-sheet import, OCR search, 10 categories, Collections and tags, Clean-Up, Private Vault, Settings, Paywall with 7-day trial, Free limits (500 screenshots, 3 Collections).
Out until later: Receipt Tracker and Smart Actions (v1.1), Cloud Sync, Pro, natural-language search (v1.2), Team (v2.0), Account and Sync screen.

## Conventions
- Dart null-safe; `dart format`; `flutter analyze` must be clean.
- Feature-first folders (`lib/features/<name>/{data,domain,ui}`), shared code in `lib/core`.
- Small PRs, one feature each; conventional commits (`feat:`, `fix:`, `chore:`).
- Every PR: tests for logic, screenshots of UI changes (light and dark), no new warnings.

## Commands (fill in once the repo exists)
`flutter pub get` / `flutter run` / `flutter test` / `flutter analyze`

## Definition of done
Works offline, tested on a low-end Android device, matches the design, gated by the right entitlement, analytics added, privacy rules respected, tests pass.

## Open decisions (ask the product owner)
Flutter vs React Native, final prices, Android-first or both at launch, name and store availability check for "Shotly", whether to offer Lifetime at launch.
