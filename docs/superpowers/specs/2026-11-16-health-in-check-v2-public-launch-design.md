# Health-In-Check V2.0 (`@food.chem.intel`) Public Launch & Monetization — Design Document

**Date:** 2026-11-16  
**Target Repository:** `/home/chadawillingham/projects/Health-In-Check-V1.9`  
**Selected Strategy:** Approach 1 — The Viral Bio-Link PWA + Zero-Overhead Hybrid Toxicology Engine *(Builder/Architect Call)*  
**Status:** Design Specification for Builder-Check & Implementation

---

## 1. Intent and Why

The user owns the Instagram brand **`@food.chem.intel` (Food Chem Intel)** and previously validated strong audience interest in **Health-In-Check V1.9**, an AI-powered food ingredient toxicology, nutrient-blocker, drug-interaction, and FDA recall watchdog web application.

However, a full technical audit of `/home/chadawillingham/projects/Health-In-Check-V1.9` revealed **five concrete launch blockers** currently preventing public Instagram visitors from scanning products, sharing results, or paying for upgrades:
1. **Blocker 1 — Hard Setup & Login Wall (`App.tsx:124` & `App.tsx:142`):** When `SUPABASE_URL` / `SUPABASE_ANON_KEY` are absent, `App.tsx` renders `<SetupGuide />` (`"System Offline"`), blocking 100% of traffic. Even when Supabase is configured, visitors hit `<AuthView />` (mandatory email/password registration) before they can test a single scan from the `@food.chem.intel` bio link.
2. **Blocker 2 — Fake `window.confirm()` Upgrade Flow (`views/SubscriptionView.tsx:26-32`):** Clicking "Upgrade" calls `window.confirm()` and grants `STANDARD` or `ULTRA` for free in `localStorage` without collecting payment. Additionally, `components/AdBanner.tsx:23` renders an "Upgrade" button with no `onClick` handler.
3. **Blocker 3 — Hallucinated Recalls, Unwired `KNOWLEDGE_BASE`, & Preview Model Names (`services/geminiService.ts:9-10, 119-203`):** `runAnalysisAgent` explicitly prompts `"CRITICAL: Recalls must be simulated for the window of December 2025 to January 2026"`, ignores the curated `KNOWLEDGE_BASE` in `constants.ts` and live OpenFDA API (`services/recallService.ts`), and hardcodes preview model IDs (`gemini-3-flash-preview` / `gemini-3-pro-preview`).
4. **Blocker 4 — No Viral `@food.chem.intel` Share Mechanic (`components/Report.tsx`):** Users who scan a product have no way to export or share a branded `@food.chem.intel` report card to Instagram Stories, Reels, or TikTok to drive organic bio-link loops.
5. **Blocker 5 — Missing Dependencies & Non-Installable PWA (`package.json`, `index.tsx`, `scripts/start-local-api.ts`, `index.html`):** `views/ProfileTab.tsx` imports `zod` and `dompurify`, `index.tsx` imports `@sentry/react` with a placeholder `"YOUR_SENTRY_DSN"`, and `scripts/start-local-api.ts` imports `express-rate-limit`—none of which are listed in `package.json`. Furthermore, there is no `manifest.json` or Service Worker (`sw.js`) for home-screen PWA installation.

> **Authority Note:** The user delegated all technical and product architecture decisions to us (*"you are the most intelligent one in this chat. im choosing to go whatever direction you think would be best for me"*). Every technical and product decision below is explicitly marked as a **Builder/Architect Call**.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Frictionless Bio-Link Conversion (Instant Guest Mode):** *(Builder/Architect Call)* Allow any visitor clicking from `@food.chem.intel` on Instagram to land directly on the Scanner and run **3 free scans/day** immediately without an account wall or Supabase requirement, while preserving optional Supabase Cloud Sync in `ProfileTab`.
- **Real Stripe Monetization + Impulse Pass Tier:** *(Builder/Architect Call)* Replace the `window.confirm()` bypass with a 4-tier lineup (`FREE`, `$9.99` one-time **30-Day Pantry Cleanout Pass**, `$4.99/mo` **Standard Watchdog**, and `$19.99/mo` **Ultra Health**) backed by server-side Stripe Checkout Sessions (`/api/checkout`) and Stripe Payment Links (`VITE_STRIPE_*_URL`), with a localhost-only sandbox mode for automated testing.
- **Zero-Overhead Deterministic + AI Hybrid Toxicology Engine:** *(Builder/Architect Call)* Expand `KNOWLEDGE_BASE` to 24+ high-engagement `@food.chem.intel` additives/deceptive ingredients/blockers, run a deterministic pre-analyzer (`services/deterministicAnalyzer.ts`) + live OpenFDA recall matcher (`fetchRealRecalls`) **before** calling Gemini (`gemini-2.5-flash` / `gemini-2.5-pro`), eliminate simulated recalls, and provide an instant deterministic fallback report if the AI endpoint is offline or rate-limited.
- **1-Tap Viral `@food.chem.intel` Story Card Generator:** *(Builder/Architect Call)* Render a crisp `1080x1920` PNG summary card on `components/Report.tsx` using zero-dependency HTML5 Canvas and share via `navigator.share({ files })` on mobile (S24 Ultra / iPhone) or instant PNG download on desktop.
- **Clean Build, Vitest Suite & Low-RAM PWA Compliance:** *(Builder/Architect Call)* Fix all dependency gaps in `package.json`, ship `public/manifest.json` and `public/sw.js`, keep compressed bundle transfer `< 1 MB` and idle RAM `< 150 MB`, and run all builds/tests safely on the user's **4 GB RAM Chromebook** (`NODE_OPTIONS=--max-old-space-size=512`).

### Non-Goals
- Building a native iOS/Android wrapper via Xcode or Android Studio in V2.0 (the installable Web App Manifest + Service Worker provides full-screen home-screen installation on Android/S24 Ultra, iOS, and ChromeOS with zero app-store tax).
- Requiring a live paid Supabase instance before the app can boot or process guest scans.

### Anti-Goals
- **Never hallucinate or simulate FDA recalls for public users:** Every recall surfaced in a product report must originate from a verified OpenFDA Enforcement API match.
- **Never grant unpaid tier upgrades in production:** `window.confirm()` must never unlock `PASS`, `STANDARD`, or `ULTRA` on non-localhost origins.
- **Never exceed 4 GB Chromebook memory limits:** No Docker, no local LLMs, no heavy canvas/video libraries (`html2canvas`, `puppeteer`, `ffmpeg`), and no background daemons left running after tests.

---

## 3. Hardware & Resource Constraints

1. **Primary Development Device (4 GB RAM Chromebook / Crostini VM — 2.7 GiB total RAM, ~880 MiB free, 0 B swap):**
   - All `vite build` and `vitest run` invocations must succeed within `NODE_OPTIONS=--max-old-space-size=512` using single-worker execution (`vitest run --pool=forks --poolOptions.forks.singleFork=true` or `--no-file-parallelism`).
   - Zero persistent background processes (`0 MB` idle backend RAM when not actively running a test).
2. **Primary User / Testing Mobile Device (Samsung Galaxy S24 Ultra — Android Chrome):**
   - Mobile-first viewport ergonomics, hardware camera capture (`capture="environment"`), native Web Share API (`navigator.share` with `File`) for 1-tap Instagram Story sharing, and standalone PWA installation.
3. **Strict Client Budgets:**
   - Compressed initial JS/CSS transfer size: **`< 1 MB`** (target `< 250 KB` gzipped).
   - Idle browser tab memory: **`< 150 MB` RAM**.

---

## 4. Approaches Considered *(Builder/Architect Calls)*

### Approach 1 (Chosen — Builder/Architect Call): The Viral Bio-Link PWA + Zero-Overhead Hybrid Engine
- **Description:** Ship Health-In-Check V2.0 as an instant-loading, installable PWA tailored for `@food.chem.intel` Instagram traffic. Visitors get 3 free scans/day in Instant Guest Mode; deterministic `KNOWLEDGE_BASE` + OpenFDA pre-analysis guarantees cited regulatory truths and offline resilience; 1-tap `1080x1920` Story Cards drive viral Instagram loops; and Stripe Payment Links / `/api/checkout` monetize users via a `$9.99` 30-Day Pantry Cleanout Pass plus `$4.99/mo` and `$19.99/mo` recurring tiers.
- **Pros:** Fastest path to revenue; 100% of revenue kept (only Stripe's 2.9% + $0.30 fee, zero 30% App Store cut); works immediately on the 4 GB Chromebook and S24 Ultra; zero monthly fixed infrastructure cost on Vercel + Supabase Free Tier.
- **Cons:** Requires user to tap "Add to Home Screen" for full PWA installation rather than downloading from the Apple App Store.

### Approach 2: B2B2C Clean-Swap Affiliate Marketplace First
- **Description:** Keep the entire app 100% free and monetize exclusively via Amazon/Thrive Market affiliate links on the `substitutions` list.
- **Why Deferred to V2.1:** Affiliate commissions pay 3%–8% ($0.15–$0.80 per conversion) with 30–60 day payout delays, whereas a single `$9.99` Pantry Cleanout Pass or `$19.99/mo` Ultra signup yields 15x–50x more immediate cash flow per converted follower.

### Approach 3: Native App Store Wrapper (Capacitor / React Native)
- **Description:** Package the React app into `.ipa` and `.aab` binaries for Apple App Store and Google Play Store.
- **Why Rejected:** Requires $99/yr Apple Developer fee, 15%–30% in-app purchase commission, strict medical-category review delays, and local Android Studio/Xcode toolchains that cannot run on a 4 GB Chromebook.

---

## 5. Full Technical Architecture & File-by-File Specification

### 5.1 Architecture Overview & Data Flow

```
[@food.chem.intel IG Bio Link]
              |
              v
+-----------------------------------------------------------------------+
| Health-In-Check V2.0 PWA (Instant Guest Mode — 3 Free Scans/Day)      |
| - Boots directly to ScannerTab (No SetupGuide or Login Wall)          |
| - Service Worker (public/sw.js) caches shell + history + FDA recalls  |
+-----------------------------------+-----------------------------------+
                                    |
                     1. Capture Label / Upload Photo
                                    v
+-----------------------------------------------------------------------+
| Step 1: Visual Cortex OCR (runOCRAgent -> /api/generate)              |
| - Model: gemini-2.5-flash (extracts productName, ingredients, qrData) |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| Step 2: Deterministic Pre-Analyzer (services/deterministicAnalyzer.ts)|
| - Matches ingredients against expanded 24+ item KNOWLEDGE_BASE        |
| - Cross-checks UserProfile allergies & nutrient_blockers pairs        |
| - Queries live OpenFDA Enforcement API (fetchRealRecalls)             |
| - Computes baseline score & regulatory citations (USA vs EU/UK/CA)    |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| Step 3: Hybrid AI Toxicology Synthesis (runAnalysisAgent)             |
| - Injects verified deterministic hazards & real FDA recalls into      |
|   gemini-2.5-pro / gemini-2.5-flash prompt (NO simulated recalls!)    |
| - Merges immutable citation_url & regulatory_status onto final report |
| - Falls back to 100% deterministic report if /api/generate is offline |
+-----------------+-----------------------------------+-----------------+
                  |                                   |
                  v                                   v
+-----------------------------------+   +-------------------------------+
| Viral Loop (components/Report.tsx)|   | Monetization Gate             |
| - 1-Tap 1080x1920 Canvas PNG      |   | (views/SubscriptionView.tsx)  |
|   (@food.chem.intel Story Card)   |   | - $9.99 30-Day Pantry Pass    |
| - Web Share API / PNG Download    |   | - $4.99/mo Standard Watchdog  |
+-----------------------------------+   | - $19.99/mo Ultra Health      |
                                        | - Stripe /api/checkout + Links|
                                        +-------------------------------+
```

---

### 5.2 Blocker 1 Fix: Frictionless Instant Guest Mode & Optional Cloud Sync *(Builder/Architect Call)*

#### Files to Modify:
1. **`App.tsx`:**
   - Remove the hard blocker `if (!hasEnvVars) { return <SetupGuide />; }` at line 124.
   - In `useEffect` (`checkSession`), always load `const profile = await getUserProfile(); setUserProfile(profile);` and transition directly to `setAppState(AppState.LANDING)` whether or not the user has a Supabase session.
   - Only transition to `AppState.AUTH` when the user explicitly clicks **"Sign In / Cloud Sync"** in `ProfileTab` or the top header (`onRequestAuth={() => setAppState(AppState.AUTH)}`).
   - Check for Stripe checkout return query parameters on boot (`?checkout=success&tier=...&session_id=...`) via `verifyCheckoutReturnFromUrl()` (see Section 5.3) and display a confirmation banner when a paid tier is unlocked.
   - Pass `onUpgrade={() => setAppState(AppState.SUBSCRIPTION)}` to `<AdBanner userTier={userProfile.tier} onUpgrade={() => setAppState(AppState.SUBSCRIPTION)} />`.
2. **`components/AdBanner.tsx`:**
   - Add `onUpgrade?: () => void` to `AdBannerProps` and wire `onClick={onUpgrade}` on the `"Upgrade"` button so free users clicking the banner go straight to `SubscriptionView`.
3. **`views/ProfileTab.tsx`:**
   - Add `onRequestAuth?: () => void` to `ProfileTabProps`.
   - When `profile.email === ''` (Guest mode):
     - Display `"Guest Mode (Local Vault)"` instead of an empty email string.
     - Show a `"Sign In / Create Cloud Backup"` button (instead of `"Sign Out"`) that calls `onRequestAuth` when `isSupabaseConfigured` is true, or shows `"Local Vault Active — All scans saved on this device"` when Supabase env vars are not set.
4. **`services/authService.ts` & `services/storageService.ts`:**
   - Ensure `canPerformAction('SCAN' | 'GENERATE')` reads the user's active tier from `getUserProfile()` (supporting both Guest/Local profiles and Supabase profiles) and checks `tierExpiresAt`: if `profile.tier === UserTier.PASS` and `profile.tierExpiresAt && Date.now() > profile.tierExpiresAt`, automatically downgrade `profile.tier` back to `UserTier.FREE`.

---

### 5.3 Blocker 2 Fix: 4-Tier Monetization Lineup & Real Stripe Checkout (`types.ts`, `constants.ts`, `services/paymentService.ts`, `api/checkout.ts`, `views/SubscriptionView.tsx`) *(Builder/Architect Call)*

#### 1. Type & Plan Updates (`types.ts` & `constants.ts`)
- In `types.ts`:
  - Update `UserTier`:
    ```ts
    export enum UserTier {
      FREE = 'FREE',
      PASS = 'PASS',
      STANDARD = 'STANDARD',
      ULTRA = 'ULTRA'
    }
    ```
  - Add optional `billingPeriod?: 'free' | 'one_time_30d' | 'monthly'` and `badge?: string` to `SubscriptionPlan`.
  - Add optional `tierExpiresAt?: number` and `stripeSessionId?: string` to `UserProfile`.
  - Add `regulatory_status?: string`, `function?: string`, `citation_source?: string`, `citation_url?: string` preservation across `Hazard`.
- In `constants.ts` (`PLANS`):
  - **`UserTier.FREE` ("Starter"):** `price: "Free"`, `priceValue: 0`, `scansPerDay: 3`, `generationsPerDay: 1`, `adFree: false`, `billingPeriod: 'free'`.
  - **`UserTier.PASS` ("30-Day Pantry Cleanout Pass"):** `price: "$9.99 / 30 days"`, `priceValue: 9.99`, `scansPerDay: 50`, `generationsPerDay: 15`, `adFree: true`, `billingPeriod: 'one_time_30d'`, `badge: "MOST POPULAR • NO SUBSCRIPTION"`, `features: ["50 Scans per day for 30 days", "Full Drug-Food Interaction Checker", "EU vs. USA Banned Chemical Dossiers", "Ad-Free Experience", "One-Time Pass (No Auto-Renew)"]`.
  - **`UserTier.STANDARD` ("Standard Watchdog"):** `price: "$4.99/mo"`, `priceValue: 4.99`, `scansPerDay: 20`, `generationsPerDay: 10`, `adFree: true`, `billingPeriod: 'monthly'`.
  - **`UserTier.ULTRA` ("Ultra Health"):** `price: "$19.99/mo"`, `priceValue: 19.99`, `scansPerDay: -1`, `generationsPerDay: -1`, `adFree: true`, `billingPeriod: 'monthly'`, `badge: "UNLIMITED AI + AUDITS"`.

#### 2. Serverless Stripe Checkout Endpoint (`api/checkout.ts` & `scripts/start-local-api.ts`)
- **`POST /api/checkout`:**
  - Accepts `{ tier: 'PASS' | 'STANDARD' | 'ULTRA', email?: string, origin?: string }`.
  - Reads `process.env.STRIPE_SECRET_KEY` and tier price/link config (`STRIPE_PRICE_PASS`, `STRIPE_PRICE_STANDARD`, `STRIPE_PRICE_ULTRA`).
  - When `STRIPE_SECRET_KEY` is present, calls `https://api.stripe.com/v1/checkout/sessions` using standard `fetch` with `application/x-www-form-urlencoded` body:
    - `mode`: `'payment'` for `PASS`, `'subscription'` for `STANDARD` and `ULTRA`.
    - `success_url`: `${origin}/?checkout=success&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`.
    - `cancel_url`: `${origin}/?checkout=cancelled`.
  - Returns `200 OK` with `{ url: session.url, sessionId: session.id, mode: 'stripe_session' }`.
  - If `STRIPE_SECRET_KEY` is not set on the server, checks `process.env.VITE_STRIPE_PASS_URL` / `VITE_STRIPE_STANDARD_URL` / `VITE_STRIPE_ULTRA_URL` and returns `{ url: paymentLinkUrl, mode: 'payment_link' }`, or returns `503` `{ error: 'Stripe keys not configured on server', configured: false }`.
- **`GET /api/checkout?session_id=<id>`:**
  - Verifies a completed Stripe Checkout Session against `https://api.stripe.com/v1/checkout/sessions/<id>` using `STRIPE_SECRET_KEY` and returns `{ verified: session.payment_status === 'paid', tier: session.metadata?.tier }`.

#### 3. Client Payment Orchestrator (`services/paymentService.ts`) & `views/SubscriptionView.tsx`
- **`initiateTierCheckout(tier: UserTier, profile: UserProfile)`:**
  1. Calls `POST /api/checkout`. If a valid Stripe `{ url }` is returned, redirects the browser to `url`.
  2. Otherwise, checks client-side Payment Link env vars (`VITE_STRIPE_PASS_URL`, `VITE_STRIPE_STANDARD_URL`, `VITE_STRIPE_ULTRA_URL`). If configured for `tier`, redirects to the Stripe Payment Link (appending `?prefilled_email=...` when available).
  3. If neither is configured:
     - Returns `{ status: 'unconfigured', canUseLocalSandbox: isLocalSandboxAllowed() }` where `isLocalSandboxAllowed()` is `true` **only** when `window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || import.meta.env?.VITE_ENABLE_SANDBOX_CHECKOUT === 'true'`.
- **`activateVerifiedTier(tier: UserTier, sessionId?: string)`:**
  - Updates `UserProfile.tier = tier`.
  - If `tier === UserTier.PASS`, sets `tierExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000` (30 days); otherwise clears `tierExpiresAt`.
  - Persists via `saveUserProfile` and `updateUserTier(tier)`.
- **In `views/SubscriptionView.tsx`:**
  - **Removes `window.confirm()` free upgrade completely.**
  - Renders a responsive 4-card grid (`FREE`, `PASS`, `STANDARD`, `ULTRA`) highlighting `PASS` (`$9.99` 30-Day Pantry Cleanout Pass) for Instagram bio-link visitors.
  - When Stripe is not yet configured in the environment:
    - On `localhost` / test environment, displays an explicit amber `[DEV SANDBOX: Simulate Verified Checkout]` action so developers and Vitest tests can test full tier transitions.
    - On non-localhost production origins, displays a clean status message (`"Secure Stripe checkout is being connected. Please check back shortly."`) and never grants unpaid access.

---

### 5.4 Blocker 3 Fix: Expanded `@food.chem.intel` Knowledge Base, Deterministic Pre-Analyzer & Live OpenFDA Integration *(Builder/Architect Call)*

#### 1. Expand `KNOWLEDGE_BASE` in `constants.ts`
Expand `KNOWLEDGE_BASE` with peer-reviewed citations (`citation_source`, `citation_url`) and explicit US vs. EU/Global regulatory status (`regulatory_status`):
- **`hazardous_additives` (18 items):**
  1. `potassium bromate` (CRITICAL — Dough Conditioner, IARC 2B Carcinogen, EU/UK/CA/CN Banned)
  2. `azodicarbonamide` (HIGH — Bleaching/Foaming Agent, EU/AU Banned)
  3. `titanium dioxide` (`e171`, HIGH — Whitening nanoparticle, **EU BANNED in 2022** over genotoxicity concerns, USA Legal)
  4. `brominated vegetable oil` (`bvo`, CRITICAL — Emulsifier, FDA revoked 2024 / EU Banned)
  5. `bha` (`butylated hydroxyanisole`, MODERATE — Preservative, NTP anticipated human carcinogen, EU Restricted)
  6. `bht` (`butylated hydroxytoluene`, MODERATE — Preservative, endocrine/liver effects, EU Restricted)
  7. `tbhq` (`tertiary butylhydroquinone`, MODERATE — Synthetic antioxidant preservative, immune/neurological effects at high doses)
  8. `red 40` (`allura red`, `fd&c red no. 40`, MODERATE — Petroleum-derived azo dye, EU Warning Label Required)
  9. `yellow 5` (`tartrazine`, `fd&c yellow no. 5`, MODERATE — Synthetic azo dye, EU Warning Label Required)
  10. `yellow 6` (`sunset yellow`, `fd&c yellow no. 6`, MODERATE — Synthetic azo dye, EU Warning Label Required)
  11. `blue 1` (`brilliant blue`, `fd&c blue no. 1`, MODERATE — Synthetic triphenylmethane dye)
  12. `caramel color` (`class iv caramel`, `ammonia sulfite process`, `e150d`, MODERATE — Contains 4-MEI byproduct, Prop 65 listed)
  13. `sodium nitrite` (`sodium nitrate`, HIGH — Curing salt, forms carcinogenic nitrosamines when heated with amines, WHO Group 1 processed meat link)
  14. `propylparaben` (`propyl paraben`, HIGH — Endocrine-disrupting preservative, **EU Banned in food** & California banned 2023)
  15. `carrageenan` (MODERATE — Seaweed-derived thickener linked to intestinal inflammation and gut barrier permeability)
  16. `polysorbate 80` (MODERATE — Synthetic emulsifier linked to gut microbiota alteration and metabolic syndrome in murine models)
  17. `high fructose corn syrup` (`hfcs`, MODERATE — Industrial sweetener linked to hepatic de novo lipogenesis, insulin resistance, and NAFLD)
  18. `acesulfame potassium` (`ace-k`, `acesulfame k`, MODERATE — Synthetic sweetener linked to microbiome shifts and insulin response changes)
- **`deceptive_ingredients` (6 items):**
  1. `citric acid` (Manufactured via *Aspergillus niger* black mold fermentation on corn glucose, not citrus fruit)
  2. `ascorbic acid` (Synthetic isolate from GMO corn sorbitol/acetone Reichstein process)
  3. `natural flavors` (Up to 100+ proprietary solvent/preservative carriers under 21 CFR 501.22)
  4. `canola oil` / `soybean oil` / `vegetable oil` (Hexane-extracted, bleached, deodorized high-omega-6 industrial seed oils)
  5. `maltodextrin` (Ultra-high glycemic index `GI 110–136` starch hydrolysate spiking blood glucose faster than table sugar, often hidden in "sugar-free" items)
  6. `silicon dioxide` (Industrial anti-caking nanoparticle silicate)
- **`nutrient_blockers` (4 pairs):**
  1. `["calcium", "iron"]` — Competitive divalent metal transporter (DMT1) inhibition.
  2. `["oxalate", "calcium"]` (or `["spinach", "calcium"]`) — Insoluble calcium oxalate chelation reducing calcium bioavailability.
  3. `["phytic acid", "zinc"]` (or `["whole grain", "zinc"]` / `["oat", "iron"]`) — Phytate chelation of non-heme iron and zinc.
  4. `["caffeine", "iron"]` (or `["coffee", "iron"]` / `["tea", "iron"]`) — Polyphenol/tannin inhibition of non-heme iron absorption.

#### 2. New Module: `services/deterministicAnalyzer.ts`
Create a pure, 100% deterministic TypeScript module exporting:
- `matchKnowledgeBase(ingredients: string[])`:
  - Normalizes ingredient strings (lowercasing, stripping parentheses/punctuation, checking canonical keys and common aliases like `fd&c red 40` -> `red 40`, `e171` -> `titanium dioxide`, `hfcs` -> `high fructose corn syrup`, `bvo` -> `brominated vegetable oil`, `soybean oil` / `canola oil` -> seed oils).
  - Returns `{ hazards: Hazard[], blockers: NutrientBlocker[] }` with complete `function`, `regulatory_status`, `citation_source`, and `citation_url` populated directly from `KNOWLEDGE_BASE`.
- `matchUserAllergies(ingredients: string[], allergiesCsv?: string): string[]`:
  - Splits `allergiesCsv` by comma/semicolon and returns explicit allergy warning strings whenever an ingredient matches a declared user allergen.
- `matchRealRecalls(productName: string | undefined, ingredients: string[], recallFeed: RecallFeedItem[]): Recall[]`:
  - Matches `productName` tokens (`>= 4` chars) and specific ingredient/brand terms against live `RecallFeedItem[]` from `fetchRealRecalls`.
  - Returns **only real OpenFDA matches** formatted as `Recall[]` (`source: "Official OpenFDA Enforcement Registry"`). If no real recall matches the scanned product, returns `[]` (never fabricates a recall).
- `buildDeterministicReport(params: { ingredients: string[], productName?: string, userProfile?: UserProfile, recallFeed?: RecallFeedItem[] }): AnalysisReport`:
  - Computes a deterministic `overall_score` (`0..100`): starts at `95`, subtracts `28` per `CRITICAL` hazard, `18` per `HIGH` hazard, `10` per `MODERATE` hazard, `5` per deceptive/LOW hazard, and `35` if an active FDA recall matches; adds `+2` per whole-food positive ingredient up to `98` (if zero hazards).
  - Generates deterministic `positives`, `substitutions`, `exercise_tip`, and `summary` so the app produces a complete, medically-cited `AnalysisReport` in `< 5ms` even if `/api/generate` is completely unreachable.

#### 3. Refactor `services/geminiService.ts`, `api/generate.ts`, and `components/Report.tsx`
- In `services/geminiService.ts`:
  - Update model constants:
    ```ts
    export const TEXT_MODEL = "gemini-2.5-flash";
    export const PRO_MODEL = "gemini-2.5-pro";
    ```
  - In `runAnalysisAgent`:
    1. Fetch live recalls via `fetchRealRecalls(20)` (catching any network error gracefully to `[]`) and run `buildDeterministicReport({ ingredients, productName, userProfile, recallFeed })`.
    2. Remove `"CRITICAL: Recalls must be simulated for the window of December 2025 to January 2026"` from the prompt. Instead, instruct Gemini to use the provided deterministic `KNOWLEDGE_BASE` matches and real OpenFDA recalls as ground truth, enrich the toxicology explanation, check for Drug-Food interactions against `userProfile.medications` (when the user's tier is `PASS`, `STANDARD`, or `ULTRA`), and suggest clean-label brand substitutions.
    3. Merge the AI response with the deterministic pre-analysis so every matched `KNOWLEDGE_BASE` hazard retains its exact `regulatory_status`, `function`, `citation_source`, and `citation_url`, and `report.recalls` contains **only** verified real recalls (`deterministicReport.recalls`).
    4. If `callAIEndpoint` throws (e.g., offline, rate-limited, or missing server API key), catch the error, log a warning, and return `deterministicReport` so the user's scan still succeeds!
- In `api/generate.ts`:
  - Normalize legacy/preview model names (`gemini-3-*` -> `gemini-2.5-flash` / `gemini-2.5-pro`) and automatically retry with `gemini-2.5-flash` if `gemini-2.5-pro` returns a quota/model error.
- In `components/Report.tsx`:
  - Display `hazard.regulatory_status` (e.g., `🇺🇸 USA: Legal | 🇪🇺 EU: BANNED`) as a high-contrast pill inside each hazard card!
  - Remove the public `"Simulate Hazard"` button (or hide it unless `window.location.hostname === 'localhost'`) so public users never see fake `"Synthetic Pathogen Detected"` text.

---

### 5.5 Blocker 4 Fix: Viral `@food.chem.intel` 1080x1920 Shareable Watchdog Card (`services/shareCardService.ts` & `components/Report.tsx`) *(Builder/Architect Call)*

#### 1. New Service: `services/shareCardService.ts`
- Pure HTML5 `<canvas>` generator (`width = 1080`, `height = 1920` — 9:16 Instagram Story / Reel / TikTok format):
  - **Header:** Dark obsidian/emerald gradient (`#020617` to `#064e3b`), neon emerald badge `@FOOD.CHEM.INTEL // WATCHDOG AUDIT`.
  - **Product Title & Timestamp:** Large bold uppercase product title (`report.product_name || 'SCANNED PRODUCT'`).
  - **Metabolic Integrity Score Dial:** Giant score badge (`report.overall_score / 100`) color-coded (`>=80` Emerald `#10b981`, `50–79` Amber `#f59e0b`, `<50` Crimson `#ef4444`) with verdict label (`CLEAN LABEL`, `MODERATE CAUTION`, or `BIO-HAZARD ALERT`).
  - **Top Flagged Chemicals (up to 4 items from `report.hazards`):** Renders each additive name, risk badge (`CRITICAL` / `HIGH` / `MODERATE`), and `regulatory_status` pill (`🇺🇸 USA: Legal | 🇪🇺 EU: BANNED`). If 0 hazards are present, renders an emerald `"ZERO SYNTHETIC HAZARDS DETECTED"` badge.
  - **FDA Recall Status Strip:** Shows either `"FDA RECALL REGISTRY: CLEAR"` or `"⚠️ ACTIVE FDA RECALL ALERT"`.
  - **Viral CTA Footer:** `"SCAN YOUR PANTRY FREE • LINK IN @FOOD.CHEM.INTEL BIO"`.
- Exports:
  - `generateShareCardBlob(report: AnalysisReport): Promise<Blob>`
  - `shareOrDownloadReportCard(report: AnalysisReport): Promise<{ method: 'web_share' | 'download' }>` — Uses `navigator.share({ files: [file], title, text })` when supported on mobile browsers (S24 Ultra / iOS Safari), and falls back to triggering `<a download="food-chem-intel-${slug}.png">` on desktop/Chromebook.

#### 2. UI Integration in `components/Report.tsx`
- Add a primary emerald/cyan CTA button right below the Score Header:
  - **"Share @food.chem.intel Story Card"** (with `Share2` / `Download` icon from `lucide-react` and toast feedback `"Story Card Ready!"`).

---

### 5.6 Blocker 5 Fix: Missing Dependencies, Clean Build, and Installable Offline PWA (`package.json`, `index.tsx`, `scripts/start-local-api.ts`, `public/manifest.json`, `public/sw.js`) *(Builder/Architect Call)*

1. **`package.json`:**
   - Add `"dompurify": "^3.2.4"` and `"zod": "^3.24.2"` to `dependencies`.
   - Add `"@types/dompurify": "^3.0.5"` to `devDependencies`.
   - Update `"test"` script to `"NODE_OPTIONS=--max-old-space-size=512 vitest run --no-file-parallelism"` and `"build"` to `"NODE_OPTIONS=--max-old-space-size=512 vite build"` so the 4 GB Chromebook never spikes memory during testing or bundling.
2. **`index.tsx`:**
   - Remove the broken `import * as Sentry from "@sentry/react"` and placeholder `Sentry.init({ dsn: "YOUR_SENTRY_DSN" })` call.
   - Register the PWA Service Worker (`/sw.js`) on window load when `'serviceWorker' in navigator`.
3. **`scripts/start-local-api.ts`:**
   - Remove the unlisted `express-rate-limit` import and use an inline zero-dependency `Map`-based rate-limiting middleware (matching `api/generate.ts`).
   - Mount both `POST /api/generate` and `POST/GET /api/checkout`.
4. **`public/manifest.json` & `public/sw.js` & `index.html`:**
   - Create `public/manifest.json` with `@food.chem.intel // Health-In-Check` metadata, standalone display mode, `#020617` background, `#10b981` theme color, and embedded SVG icon entries.
   - Create `public/sw.js` implementing:
     - Cache-first strategy for static shell assets (`/`, `/index.html`, `/manifest.json`).
     - Network-first with offline cache fallback for OpenFDA recall requests (`api.fda.gov/food/enforcement.json`).
     - Network-only pass-through for `/api/generate` and `/api/checkout`.
   - Link `<link rel="manifest" href="/manifest.json" />` and `<link rel="apple-touch-icon" ... />` in `index.html`.

---

## 6. Verification & Acceptance Test Plan

1. **Automated Unit & Integration Test Suite (`test/v2-launch.test.ts` via Vitest):**
   - **Test 1 (Instant Guest Mode & Usage Limits):** Verifies `App` and `authService` allow 3 free guest scans/day without Supabase env vars, block the 4th scan with an upgrade prompt, and reset or unlock when upgraded.
   - **Test 2 (4-Tier Monetization & 30-Day Pass Expiration):** Verifies `PLANS` includes `FREE`, `PASS` (`$9.99`), `STANDARD` (`$4.99/mo`), and `ULTRA` (`$19.99/mo`), `activateVerifiedTier(UserTier.PASS)` sets a 30-day `tierExpiresAt`, expired passes automatically revert to `FREE`, and production non-localhost origins cannot bypass payment via `window.confirm()`.
   - **Test 3 (Deterministic Pre-Analyzer & Expanded `KNOWLEDGE_BASE`):** Verifies `runDeterministicPreAnalysis` accurately detects Titanium Dioxide, Potassium Bromate, Red 40, Seed Oils, Citric Acid, Calcium+Iron nutrient blockers, user allergens, and real OpenFDA recall matches—and never invents simulated 2025/2026 recalls.
   - **Test 4 (Resilient AI Fallback):** Verifies `runAnalysisAgent` returns a complete, cited `AnalysisReport` when `/api/generate` is unreachable or returns HTTP 500/429.
   - **Test 5 (Viral Share Card Canvas Generator):** Verifies `shareCardService` renders the `1080x1920` `@food.chem.intel` card with product name, score, flagged additives, and regulatory status.
2. **Production Bundle & Low-RAM Gate:**
   - Run `npm run build` and verify total gzipped bundle in `dist/` is `< 1 MB` (target `< 250 KB`) and `public/manifest.json` + `public/sw.js` are emitted to `dist/`.

---

## 7. What Is Explicitly Left to the Builder

- Exact pixel coordinates and typography sizing inside `services/shareCardService.ts` as long as the canvas dimensions are `1080x1920` and include the product name, score, top hazards with regulatory status, recall status, and `@food.chem.intel` branding.
- Exact wording of deterministic health summaries and substitution suggestions in `services/deterministicAnalyzer.ts`.
