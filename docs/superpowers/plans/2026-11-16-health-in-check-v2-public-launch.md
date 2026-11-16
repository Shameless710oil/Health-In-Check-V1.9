# Health-In-Check V2.0 (`@food.chem.intel`) Public Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Health-In-Check V1.9 into a launch-ready, monetizable V2.0 PWA for `@food.chem.intel` with frictionless 3-scans/day Guest Mode, 4-tier Stripe checkout (`$9.99` 30-Day Pass, `$4.99/mo`, `$19.99/mo`), a 24+ item deterministic + OpenFDA + Gemini 2.5 hybrid toxicology engine, a 1-tap `1080x1920` Instagram Story card generator, and offline Service Worker support.

**Architecture:** A zero-overhead hybrid client/serverless React 19 + TypeScript PWA where extracted label ingredients first pass through a deterministic pre-analyzer (`services/deterministicAnalyzer.ts`) against an expanded peer-reviewed `KNOWLEDGE_BASE` and live OpenFDA Enforcement API before enriching via `/api/generate` (`gemini-2.5-flash` / `gemini-2.5-pro`) with automatic offline deterministic fallback. Guest usage (`3 scans/day`), 30-day Pass expiration (`tierExpiresAt`), and Stripe checkout sessions (`/api/checkout` + Payment Links) work seamlessly with `localStorage` and optional Supabase Cloud Sync.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest 4, `@google/genai`, `@supabase/supabase-js`, `zod`, `dompurify`, HTML5 2D Canvas, Web Share API, Service Worker Cache API.

**Spec:** `/home/chadawillingham/projects/Health-In-Check-V1.9/docs/superpowers/specs/2026-11-16-health-in-check-v2-public-launch-design.md`

## Global Constraints

- Primary Development Device (4 GB RAM Chromebook / Crostini VM — 2.7 GiB total RAM, ~880 MiB free, 0 B swap): All `vite build` and `vitest run` invocations must succeed within `NODE_OPTIONS=--max-old-space-size=512` using single-worker execution (`vitest run --no-file-parallelism`).
- Zero persistent background processes (`0 MB` idle backend RAM when not actively running a test).
- Compressed initial JS/CSS transfer size: `< 1 MB` (target `< 250 KB` gzipped); idle browser tab memory: `< 150 MB` RAM.
- Never hallucinate or simulate FDA recalls for public users: Every recall surfaced in a product report must originate from a verified OpenFDA Enforcement API match.
- Never grant unpaid tier upgrades in production: `window.confirm()` must never unlock `PASS`, `STANDARD`, or `ULTRA` on non-localhost origins.
- Never exceed 4 GB Chromebook memory limits: No Docker, no local LLMs, no heavy canvas/video libraries (`html2canvas`, `puppeteer`, `ffmpeg`), and no background daemons left running after tests.

## Review Focus

1. **OCR ingredient alias & punctuation variations** (e.g., `"FD&C Red No. 40 (Allura Red)"`, `"Titanium Dioxide (E171)"`, `"High-Fructose Corn Syrup"`): `matchKnowledgeBase` must normalize case/punctuation and match canonical names and aliases so OCR variants still attach the exact `KNOWLEDGE_BASE` hazard, `regulatory_status`, and `citation_url` (pinned in Task 1).
2. **Short/generic product tokens in OpenFDA recall matching** (e.g., `productName: "Water"` or `""` or `< 4` char tokens): `matchRealRecalls` must ignore tokens shorter than 4 characters and generic stopwords (`food`, `water`, `milk`, `salt`, `acid`) so unrelated FDA recalls are never falsely attached (pinned in Task 1).
3. **`/api/generate` network failure or HTTP 429/500 during `runAnalysisAgent`**: `runAnalysisAgent` must catch the endpoint failure and return the cited `buildDeterministicReport` result (with real OpenFDA recalls and zero simulated 2025/2026 recalls) instead of crashing the scan flow (pinned in Task 2).
4. **Expired `UserTier.PASS` (`tierExpiresAt <= Date.now()`) and unconfigured Stripe checkout on production hostnames**: `canPerformAction` must automatically downgrade an expired `PASS` back to `UserTier.FREE` (`limit: 3`), and `initiateTierCheckout` must return `canUseLocalSandbox: false` when `hostname` is not `localhost` / `127.0.0.1` so unpaid upgrades are impossible in production (pinned in Task 3).
5. **Browsers without file-sharing support in `navigator.canShare` / `navigator.share`**: `shareOrDownloadReportCard` must fall back cleanly to an `<a download="food-chem-intel-....png">` download and return `{ method: 'download', dataUrl }` without throwing (pinned in Task 4).

---

## File Structure

- `package.json` — Add `zod`, `dompurify`, `@types/dompurify`; configure low-RAM `build` and `test` scripts (`NODE_OPTIONS=--max-old-space-size=512`).
- `types.ts` — Add `UserTier.PASS`, `SubscriptionPlan.billingPeriod` & `badge`, `UserProfile.tierExpiresAt` & `stripeSessionId`, and optional `KnowledgeBaseItem.aliases`.
- `constants.ts` — Define 4-tier `PLANS` (`FREE`, `PASS` `$9.99`, `STANDARD` `$4.99/mo`, `ULTRA` `$19.99/mo`) and expand `KNOWLEDGE_BASE` to 18 hazardous additives, 6 deceptive ingredients, and 4 nutrient blocker pairs with US/EU regulatory statuses.
- `services/deterministicAnalyzer.ts` *(Create)* — Pure deterministic matcher for `KNOWLEDGE_BASE` hazards/deceptive ingredients/blockers, user allergies, live OpenFDA recalls, and fallback `AnalysisReport` generation.
- `services/geminiService.ts` — Switch to `gemini-2.5-flash` / `gemini-2.5-pro`, run `deterministicAnalyzer` + `fetchRealRecalls` before Gemini, remove the 2025/2026 simulated recall prompt, merge deterministic citations, and fall back to `buildDeterministicReport` on API error.
- `api/generate.ts` — Normalize legacy `gemini-3-*` model names to `gemini-2.5-flash` / `gemini-2.5-pro` with flash fallback on quota error.
- `api/checkout.ts` *(Create)* — Serverless Stripe Checkout Session creator (`POST /api/checkout`) and session verifier (`GET /api/checkout?session_id=...`).
- `scripts/start-local-api.ts` — Replace unlisted `express-rate-limit` with inline `Map` rate limiter and mount `/api/checkout`.
- `services/paymentService.ts` *(Create)* — Client Stripe Checkout / Payment Link orchestrator, localhost sandbox guard, and `activateVerifiedTier` (setting 30-day `tierExpiresAt` for `PASS`).
- `services/authService.ts` & `services/storageService.ts` — Read active tier from local/cloud `UserProfile`, enforce `tierExpiresAt` downgrade on expired `PASS`, and track guest usage (`3 scans/day`).
- `views/SubscriptionView.tsx` — Render 4-tier plan grid (`FREE`, `PASS`, `STANDARD`, `ULTRA`), remove `window.confirm()` free upgrade bug, wire `initiateTierCheckout`, and restrict sandbox activation to `localhost`.
- `services/shareCardService.ts` *(Create)* — Render `1080x1920` `@food.chem.intel` PNG Story Card via HTML5 2D Canvas and share via `navigator.share` or PNG download fallback.
- `components/Report.tsx` — Add `"Share @food.chem.intel Story Card"` button, render `hazard.regulatory_status` pills, and hide `"Simulate Hazard"` outside `localhost`.
- `App.tsx`, `views/ProfileTab.tsx`, `components/AdBanner.tsx` — Boot directly into `AppState.LANDING` (Instant Guest Mode without `<SetupGuide />` or `<AuthView />` wall), handle `?checkout=success` return URL, wire `AdBanner` `onUpgrade`, and add optional Cloud Sync sign-in in `ProfileTab`.
- `index.tsx`, `index.html`, `public/manifest.json` *(Create)*, `public/sw.js` *(Create)* — Remove broken `@sentry/react` import, link PWA manifest, and register offline Service Worker.

---

### Task 1: Dependencies, Types, Expanded `@food.chem.intel` Knowledge Base & Deterministic Pre-Analyzer

**Files:**
- Modify: `package.json`
- Modify: `types.ts`
- Modify: `constants.ts`
- Create: `services/deterministicAnalyzer.ts`
- Test: `test/deterministicAnalyzer.test.ts`

**Interfaces:**
- Consumes: `RecallFeedItem`, `UserProfile` from `types.ts`
- Produces:
  - `UserTier` (`FREE | PASS | STANDARD | ULTRA`), `SubscriptionPlan`, `UserProfile` (`tierExpiresAt?: number`, `stripeSessionId?: string`), `KnowledgeBaseItem` (`aliases?: string[]`) in `types.ts`
  - `PLANS: Record<UserTier, SubscriptionPlan>` and expanded `KNOWLEDGE_BASE: KnowledgeBase` in `constants.ts`
  - `matchKnowledgeBase(ingredients: string[]): { hazards: Hazard[]; blockers: NutrientBlocker[] }` in `services/deterministicAnalyzer.ts`
  - `matchUserAllergies(ingredients: string[], allergiesCsv?: string): string[]` in `services/deterministicAnalyzer.ts`
  - `matchRealRecalls(productName: string | undefined, ingredients: string[], recallFeed: RecallFeedItem[]): Recall[]` in `services/deterministicAnalyzer.ts`
  - `buildDeterministicReport(params: { ingredients: string[]; productName?: string; userProfile?: UserProfile; recallFeed?: RecallFeedItem[] }): AnalysisReport` in `services/deterministicAnalyzer.ts`

- [ ] **Step 1: Install missing dependencies (`zod`, `dompurify`, `@types/dompurify`), configure low-RAM scripts in `package.json`, and write the failing test `test/deterministicAnalyzer.test.ts`**

Update `package.json` scripts (`"build": "NODE_OPTIONS=--max-old-space-size=512 vite build"`, `"test": "NODE_OPTIONS=--max-old-space-size=512 vitest run --no-file-parallelism"`) and install `zod`, `dompurify`, `@types/dompurify`. Then write `test/deterministicAnalyzer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PLANS, KNOWLEDGE_BASE } from '../constants';
import { UserTier, RecallFeedItem } from '../types';
import {
  matchKnowledgeBase,
  matchUserAllergies,
  matchRealRecalls,
  buildDeterministicReport
} from '../services/deterministicAnalyzer';

describe('Task 1: Expanded KNOWLEDGE_BASE & Deterministic Pre-Analyzer', () => {
  it('defines all 4 monetization tiers including the $9.99 30-Day Pantry Cleanout Pass', () => {
    expect(PLANS[UserTier.FREE].scansPerDay).toBe(3);
    expect(PLANS[UserTier.PASS].priceValue).toBe(9.99);
    expect(PLANS[UserTier.PASS].scansPerDay).toBe(50);
    expect(PLANS[UserTier.PASS].billingPeriod).toBe('one_time_30d');
    expect(PLANS[UserTier.STANDARD].priceValue).toBe(4.99);
    expect(PLANS[UserTier.ULTRA].priceValue).toBe(19.99);
  });

  it('matches canonical additives, OCR aliases (FD&C Red No. 40, E171, HFCS), deceptive ingredients, and nutrient blockers', () => {
    const res = matchKnowledgeBase([
      'Enriched Flour (Potassium Bromate)',
      'FD&C Red No. 40 (Allura Red)',
      'Titanium Dioxide (E171)',
      'High-Fructose Corn Syrup',
      'Citric Acid',
      'Calcium Carbonate',
      'Reduced Iron'
    ]);
    const names = res.hazards.map(h => h.name.toLowerCase());
    expect(names).toEqual(
      expect.arrayContaining(['potassium bromate', 'red 40', 'titanium dioxide', 'high fructose corn syrup', 'citric acid'])
    );
    const tiO2 = res.hazards.find(h => h.name.toLowerCase() === 'titanium dioxide');
    expect(tiO2?.regulatory_status).toContain('EU: BANNED');
    expect(tiO2?.citation_url).toMatch(/^https:\/\//);
    expect(res.blockers.length).toBeGreaterThanOrEqual(1);
    expect(res.blockers[0].pair).toEqual(['calcium', 'iron']);
  });

  it('flags user allergies and ignores short/generic tokens when matching OpenFDA recalls', () => {
    const warnings = matchUserAllergies(['Whey Protein (Milk)', 'Roasted Peanuts'], 'peanuts, shellfish');
    expect(warnings).toEqual(['Contains declared allergen: Peanuts']);

    const feed: RecallFeedItem[] = [
      {
        id: 'F-001',
        date: 'Oct 15, 2026',
        product_type: 'Food',
        brand_names: 'Acme Bakery Corp',
        hazard: 'Undeclared Peanut allergen in Chocolate Crunch Bar',
        risk_level: 'Critical',
        description: 'Acme Chocolate Crunch Bar 2.5oz recalled due to undeclared peanuts.',
        action_required: 'DO NOT CONSUME.'
      }
    ];
    expect(matchRealRecalls('Water', ['Purified Water'], feed)).toEqual([]);
    const hit = matchRealRecalls('Acme Chocolate Crunch Bar', ['Sugar', 'Cocoa'], feed);
    expect(hit).toHaveLength(1);
    expect(hit[0].source).toBe('Official OpenFDA Enforcement Registry');
  });

  it('builds a complete cited AnalysisReport with deterministic scoring and zero simulated recalls', () => {
    const report = buildDeterministicReport({
      productName: 'Neon Berry Soda',
      ingredients: ['Carbonated Water', 'High Fructose Corn Syrup', 'Red 40', 'Brominated Vegetable Oil'],
      recallFeed: []
    });
    expect(report.product_name).toBe('Neon Berry Soda');
    expect(report.recalls).toEqual([]);
    expect(report.overall_score).toBeLessThan(60);
    expect(report.hazards.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/deterministicAnalyzer.test.ts --no-file-parallelism`
Expected: FAIL with module `../services/deterministicAnalyzer` not found.

- [ ] **Step 3: Implement `types.ts`, `constants.ts`, and `services/deterministicAnalyzer.ts`**

1. In `types.ts`: Add `PASS = 'PASS'` to `UserTier`; add `billingPeriod?: 'free' | 'one_time_30d' | 'monthly'` and `badge?: string` to `SubscriptionPlan`; add `tierExpiresAt?: number` and `stripeSessionId?: string` to `UserProfile`; add `aliases?: string[]` to `KnowledgeBaseItem`.
2. In `constants.ts`: Add `UserTier.PASS` (`name: "30-Day Pantry Cleanout Pass"`, `price: "$9.99 / 30 days"`, `priceValue: 9.99`, `scansPerDay: 50`, `generationsPerDay: 15`, `adFree: true`, `billingPeriod: 'one_time_30d'`, `badge: "MOST POPULAR • NO SUBSCRIPTION"`) to `PLANS`, and expand `KNOWLEDGE_BASE` with the 18 hazardous additives, 6 deceptive ingredients, and 4 nutrient blocker pairs from Spec Section 5.4 (including aliases such as `['fd&c red 40', 'fd&c red no 40', 'allura red', 'e129']` for `red 40`, `['e171', 'ci 77891']` for `titanium dioxide`, `['hfcs', 'high-fructose corn syrup']` for `high fructose corn syrup`, `['bvo']` for `brominated vegetable oil`, and `['canola oil', 'soybean oil', 'corn oil', 'cottonseed oil', 'sunflower oil']` for `refined seed oils`).
3. In `services/deterministicAnalyzer.ts`: Implement `matchKnowledgeBase`, `matchUserAllergies`, `matchRealRecalls` (filtering out stopwords `['food', 'water', 'milk', 'salt', 'acid', 'sugar', 'natural', 'organic', 'product', 'unknown']` and tokens `< 4` chars), and `buildDeterministicReport` per Spec Section 5.4.2.

- [ ] **Step 4: Run test to verify it passes**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/deterministicAnalyzer.test.ts --no-file-parallelism`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json types.ts constants.ts services/deterministicAnalyzer.ts test/deterministicAnalyzer.test.ts
git commit -m "feat(analyzer): add 4-tier plans, expanded @food.chem.intel knowledge base, and deterministic pre-analyzer"
```

---

### Task 2: Hybrid Gemini 2.5 Service, Live OpenFDA Recall Wiring, Resilient Fallback & Serverless API

**Files:**
- Modify: `services/geminiService.ts`
- Modify: `api/generate.ts`
- Create: `api/checkout.ts`
- Modify: `scripts/start-local-api.ts`
- Test: `test/geminiHybridService.test.ts`

**Interfaces:**
- Consumes: `buildDeterministicReport`, `matchKnowledgeBase`, `matchRealRecalls` from `services/deterministicAnalyzer.ts`; `fetchRealRecalls` from `services/recallService.ts`
- Produces:
  - `TEXT_MODEL = "gemini-2.5-flash"` and `PRO_MODEL = "gemini-2.5-pro"` in `services/geminiService.ts`
  - `runAnalysisAgent(ingredients: string[], qrData?: string, userProfile?: UserProfile, productName?: string): Promise<AnalysisReport>` in `services/geminiService.ts`
  - `normalizeGeminiModel(model?: string): string` and default `handler(req, res)` in `api/generate.ts`
  - `handler(req, res)` in `api/checkout.ts` supporting `POST /api/checkout` (`{ tier, email, origin }`) and `GET /api/checkout?session_id=...`

- [ ] **Step 1: Write the failing test `test/geminiHybridService.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runAnalysisAgent, TEXT_MODEL, PRO_MODEL } from '../services/geminiService';
import * as recallService from '../services/recallService';
import { normalizeGeminiModel } from '../api/generate';

describe('Task 2: Hybrid Gemini 2.5 Service & Deterministic Fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses gemini-2.5-flash and gemini-2.5-pro and normalizes legacy gemini-3 model IDs', () => {
    expect(TEXT_MODEL).toBe('gemini-2.5-flash');
    expect(PRO_MODEL).toBe('gemini-2.5-pro');
    expect(normalizeGeminiModel('gemini-3-flash-preview')).toBe('gemini-2.5-flash');
    expect(normalizeGeminiModel('gemini-3-pro-preview')).toBe('gemini-2.5-pro');
  });

  it('injects deterministic KNOWLEDGE_BASE matches into Gemini prompt without simulated recall instructions and preserves citations', async () => {
    vi.spyOn(recallService, 'fetchRealRecalls').mockResolvedValue([]);
    let capturedBody: any = null;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (_url: string, init?: any) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          text: JSON.stringify({
            product_name: 'Bread Loaf',
            hazards: [{ name: 'Potassium Bromate', risk_level: 'CRITICAL', health_impact: 'Carcinogen', verdict: 'AVOID' }],
            positives: [],
            recalls: [{ reason: 'Hallucinated Recall', date: '2026-01-01', description: 'Fake', source: 'AI' }],
            summary: 'Avoid potassium bromate.',
            overall_score: 42
          })
        })
      };
    }));

    const report = await runAnalysisAgent(['Unbleached Flour', 'Potassium Bromate'], undefined, undefined, 'Bread Loaf');
    expect(capturedBody.contents.text).not.toContain('Recalls must be simulated');
    expect(report.recalls).toEqual([]); // Only real verified OpenFDA recalls are kept
    expect(report.hazards[0].regulatory_status).toContain('EU: BANNED');
    expect(report.hazards[0].citation_url).toContain('iarc.who.int');
  });

  it('returns the complete deterministic report when /api/generate fails with 500 or network error', async () => {
    vi.spyOn(recallService, 'fetchRealRecalls').mockResolvedValue([]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    const report = await runAnalysisAgent(['Water', 'Red 40', 'Sodium Nitrite'], undefined, undefined, 'Deli Ham');
    expect(report.product_name).toBe('Deli Ham');
    expect(report.hazards.map(h => h.name.toLowerCase())).toEqual(expect.arrayContaining(['red 40', 'sodium nitrite']));
    expect(report.recalls).toEqual([]);
    expect(report.overall_score).toBeLessThan(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/geminiHybridService.test.ts --no-file-parallelism`
Expected: FAIL (`TEXT_MODEL` is `'gemini-3-flash-preview'` and `normalizeGeminiModel` is not exported).

- [ ] **Step 3: Implement `services/geminiService.ts`, `api/generate.ts`, `api/checkout.ts`, and `scripts/start-local-api.ts`**

1. In `services/geminiService.ts`:
   - Export `TEXT_MODEL = "gemini-2.5-flash"` and `PRO_MODEL = "gemini-2.5-pro"`.
   - In `runAnalysisAgent`, call `fetchRealRecalls(20).catch(() => [])` and `buildDeterministicReport({ ingredients, productName, userProfile, recallFeed })`.
   - Remove `"CRITICAL: Recalls must be simulated for the window of December 2025 to January 2026"` from `prompt`. Include the deterministic hazard matches in the prompt context.
   - When `callAIEndpoint` succeeds, merge deterministic `KNOWLEDGE_BASE` fields (`regulatory_status`, `function`, `citation_source`, `citation_url`) onto matching hazards, append any deterministic hazards the LLM omitted, and set `report.recalls = deterministicReport.recalls` so unverified AI-hallucinated recalls never appear.
   - Wrap `callAIEndpoint` in `runAnalysisAgent` in a `try / catch` that returns `deterministicReport` on failure (using `maxRetries = 1` when falling back so offline scans resolve quickly).
2. In `api/generate.ts`: Export `normalizeGeminiModel(model?: string): string` mapping any `gemini-3-*` or unknown preview string to `gemini-2.5-flash` / `gemini-2.5-pro`, and retry once with `gemini-2.5-flash` if `gemini-2.5-pro` throws a model/quota error.
3. Create `api/checkout.ts`: Implement `POST /api/checkout` (creates Stripe Checkout Session via `fetch('https://api.stripe.com/v1/checkout/sessions')` when `STRIPE_SECRET_KEY` is set, or falls back to `VITE_STRIPE_<TIER>_URL` env vars, or returns `503 { configured: false, error: 'Stripe keys not configured on server' }`) and `GET /api/checkout?session_id=...` (verifies `payment_status === 'paid'`).
4. In `scripts/start-local-api.ts`: Replace `import rateLimit from 'express-rate-limit'` with an inline zero-dependency `Map` rate limiter and mount `app.all('/api/checkout', checkoutHandler)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/geminiHybridService.test.ts --no-file-parallelism`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add services/geminiService.ts api/generate.ts api/checkout.ts scripts/start-local-api.ts test/geminiHybridService.test.ts
git commit -m "feat(ai-api): wire deterministic pre-analyzer, real OpenFDA recalls, gemini-2.5 models, and /api/checkout"
```

---

### Task 3: 4-Tier Monetization, 30-Day Pass Expiration, Stripe Payment Service & Subscription View

**Files:**
- Create: `services/paymentService.ts`
- Modify: `services/authService.ts`
- Modify: `services/storageService.ts`
- Modify: `views/SubscriptionView.tsx`
- Test: `test/paymentAndAuth.test.ts`

**Interfaces:**
- Consumes: `UserTier`, `UserProfile`, `PLANS` from `types.ts` & `constants.ts`
- Produces:
  - `isLocalSandboxAllowed(hostname?: string): boolean` in `services/paymentService.ts`
  - `initiateTierCheckout(tier: UserTier, profile: UserProfile, opts?: { hostname?: string; fetchFn?: typeof fetch }): Promise<{ status: 'redirect' | 'unconfigured'; url?: string; canUseLocalSandbox: boolean }>` in `services/paymentService.ts`
  - `activateVerifiedTier(tier: UserTier, sessionId?: string, nowMs?: number): Promise<UserProfile>` in `services/paymentService.ts`
  - `verifyCheckoutReturnFromUrl(search: string, fetchFn?: typeof fetch): Promise<{ activated: boolean; tier?: UserTier }>` in `services/paymentService.ts`
  - Updated `canPerformAction(action: 'SCAN' | 'GENERATE'): Promise<{ allowed: boolean; limit: number; current: number; tier: UserTier }>` in `services/authService.ts`

- [ ] **Step 1: Write the failing test `test/paymentAndAuth.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserTier } from '../types';
import { canPerformAction, incrementUsage } from '../services/authService';
import { getUserProfile, saveUserProfile } from '../services/storageService';
import {
  isLocalSandboxAllowed,
  initiateTierCheckout,
  activateVerifiedTier
} from '../services/paymentService';

describe('Task 3: 4-Tier Monetization, 30-Day Pass Expiration & Payment Guard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('enforces 3 scans/day in Guest FREE mode and unlocks 50 scans/day when 30-Day PASS is activated', async () => {
    for (let i = 0; i < 3; i++) {
      const check = await canPerformAction('SCAN');
      expect(check.allowed).toBe(true);
      await incrementUsage('SCAN');
    }
    const blocked = await canPerformAction('SCAN');
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(3);

    const updated = await activateVerifiedTier(UserTier.PASS, 'cs_test_123', 1000000);
    expect(updated.tier).toBe(UserTier.PASS);
    expect(updated.tierExpiresAt).toBe(1000000 + 30 * 24 * 60 * 60 * 1000);

    const afterPass = await canPerformAction('SCAN');
    expect(afterPass.allowed).toBe(true);
    expect(afterPass.limit).toBe(50);
  });

  it('automatically downgrades an expired 30-Day PASS back to FREE tier', async () => {
    const profile = await getUserProfile();
    await saveUserProfile({
      ...profile,
      tier: UserTier.PASS,
      tierExpiresAt: Date.now() - 1000 // Expired 1s ago
    });

    const check = await canPerformAction('SCAN');
    expect(check.limit).toBe(3);
    const refreshedProfile = await getUserProfile();
    expect(refreshedProfile.tier).toBe(UserTier.FREE);
  });

  it('blocks local sandbox checkout on production hostnames when Stripe is unconfigured', async () => {
    expect(isLocalSandboxAllowed('localhost')).toBe(true);
    expect(isLocalSandboxAllowed('127.0.0.1')).toBe(true);
    expect(isLocalSandboxAllowed('app.foodchemintel.com')).toBe(false);

    const profile = await getUserProfile();
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ configured: false }) });
    const prodRes = await initiateTierCheckout(UserTier.PASS, profile, {
      hostname: 'app.foodchemintel.com',
      fetchFn: mockFetch as any
    });
    expect(prodRes.status).toBe('unconfigured');
    expect(prodRes.canUseLocalSandbox).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/paymentAndAuth.test.ts --no-file-parallelism`
Expected: FAIL with module `../services/paymentService` not found.

- [ ] **Step 3: Implement `services/paymentService.ts`, `services/authService.ts`, `services/storageService.ts`, and `views/SubscriptionView.tsx`**

1. In `services/storageService.ts` and `services/authService.ts`:
   - In `getUserProfile()`, check if the stored profile has `tier === UserTier.PASS && typeof tierExpiresAt === 'number' && Date.now() > tierExpiresAt`; if so, reset `tier = UserTier.FREE`, delete `tierExpiresAt`, and persist via `localStorage.setItem('fci_auth_user', ...)`.
   - In `canPerformAction(action)`, read the active profile via `getUserProfile()` so guest/local tier upgrades (`PASS`, `STANDARD`, `ULTRA`) and admin overrides both resolve accurately.
2. Create `services/paymentService.ts`:
   - Implement `isLocalSandboxAllowed(hostname = window.location.hostname)` returning `hostname === 'localhost' || hostname === '127.0.0.1'`.
   - Implement `initiateTierCheckout(tier, profile, opts)` calling `POST /api/checkout`, falling back to `import.meta.env?.VITE_STRIPE_<TIER>_URL`, or returning `{ status: 'unconfigured', canUseLocalSandbox: isLocalSandboxAllowed(hostname) }`.
   - Implement `activateVerifiedTier(tier, sessionId, nowMs = Date.now())` setting `tierExpiresAt = tier === UserTier.PASS ? nowMs + 30 * 24 * 60 * 60 * 1000 : undefined`, saving via `saveUserProfile` + `updateUserTier`.
   - Implement `verifyCheckoutReturnFromUrl(search, fetchFn)` checking `?checkout=success&tier=...&session_id=...`.
3. In `views/SubscriptionView.tsx`:
   - Render all 4 plans (`UserTier.FREE`, `UserTier.PASS`, `UserTier.STANDARD`, `UserTier.ULTRA`) in a responsive grid (`md:grid-cols-2 lg:grid-cols-4`).
   - Remove `window.confirm()`. Call `initiateTierCheckout(tier, profile)` on click. If `status === 'redirect'`, navigate to `res.url`. If `status === 'unconfigured'`, show a production notice (`"Secure Stripe checkout is being connected. Please check back shortly."`) or—only when `res.canUseLocalSandbox` is `true`—render a clearly badged `[DEV SANDBOX: Activate Tier Locally]` button calling `activateVerifiedTier(tier)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/paymentAndAuth.test.ts --no-file-parallelism`
Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add services/paymentService.ts services/authService.ts services/storageService.ts views/SubscriptionView.tsx test/paymentAndAuth.test.ts
git commit -m "feat(billing): add 4-tier plans, 30-day pass expiry, Stripe checkout service, and safe SubscriptionView"
```

---

### Task 4: Frictionless Guest Mode, Optional Cloud Sync & Viral `@food.chem.intel` 1080x1920 Share Card

**Files:**
- Create: `services/shareCardService.ts`
- Modify: `components/Report.tsx`
- Modify: `components/AdBanner.tsx`
- Modify: `views/ProfileTab.tsx`
- Modify: `App.tsx`
- Test: `test/guestAndShareCard.test.tsx`

**Interfaces:**
- Consumes: `AnalysisReport`, `UserTier` from `types.ts`; `verifyCheckoutReturnFromUrl` from `services/paymentService.ts`
- Produces:
  - `renderShareCardDataUrl(report: AnalysisReport, doc?: Document): string` in `services/shareCardService.ts`
  - `shareOrDownloadReportCard(report: AnalysisReport, env?: { nav?: any; doc?: Document }): Promise<{ method: 'web_share' | 'download'; dataUrl: string }>` in `services/shareCardService.ts`

- [ ] **Step 1: Write the failing test `test/guestAndShareCard.test.tsx`**

```tsx
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { shareOrDownloadReportCard } from '../services/shareCardService';
import { AnalysisReport } from '../types';

describe('Task 4: Instant Guest Mode & Viral @food.chem.intel Story Card', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('fci_legal_accepted', 'true');
    sessionStorage.setItem('fci_beta_welcome', 'true');
  });

  it('boots directly into Guest Scanner mode without SetupGuide or AuthView walls even when Supabase env vars are unset', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/INITIATE SCAN/i)).toBeTruthy();
    });
    expect(screen.queryByText(/System Offline/i)).toBeNull();
  });

  it('renders a 1080x1920 @food.chem.intel Story Card and falls back to PNG download when navigator.canShare is unavailable', async () => {
    const sampleReport: AnalysisReport = {
      product_name: 'Neon Fruit Loops',
      ingredients_detected: ['Sugar', 'Red 40', 'BHT'],
      hazards: [
        {
          name: 'Red 40',
          risk_level: 'MODERATE',
          function: 'Synthetic Dye',
          health_impact: 'Hyperactivity link',
          regulatory_status: '🇺🇸 USA: Legal | 🇪🇺 EU: Warning Label Required',
          verdict: 'CAUTION',
          citation_source: 'CSPI',
          citation_url: 'https://pubmed.ncbi.nlm.nih.gov/23026007/'
        }
      ],
      positives: [],
      blockers: [],
      substitutions: [],
      recalls: [],
      exercise_tip: 'Walk 10 mins',
      summary: 'Contains synthetic dye Red 40.',
      overall_score: 54
    };

    const clickedAnchors: { download: string; href: string }[] = [];
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        const c = origCreateElement('canvas') as HTMLCanvasElement;
        c.getContext = (() => ({
          createLinearGradient: () => ({ addColorStop: () => {} }),
          fillRect: () => {},
          strokeRect: () => {},
          fillText: () => {},
          beginPath: () => {},
          arc: () => {},
          fill: () => {},
          stroke: () => {},
          roundRect: () => {}
        })) as any;
        c.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        return c;
      }
      if (tag === 'a') {
        const a = origCreateElement('a') as HTMLAnchorElement;
        a.click = () => {
          clickedAnchors.push({ download: a.download, href: a.href });
        };
        return a;
      }
      return origCreateElement(tag);
    });

    const res = await shareOrDownloadReportCard(sampleReport, { nav: {} });
    expect(res.method).toBe('download');
    expect(res.dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(clickedAnchors).toHaveLength(1);
    expect(clickedAnchors[0].download).toContain('food-chem-intel-neon-fruit-loops.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/guestAndShareCard.test.tsx --no-file-parallelism`
Expected: FAIL (`../services/shareCardService` not found and `App` renders `<SetupGuide />` when Supabase env vars are missing).

- [ ] **Step 3: Implement `services/shareCardService.ts` and update `components/Report.tsx`, `components/AdBanner.tsx`, `views/ProfileTab.tsx`, and `App.tsx`**

1. Create `services/shareCardService.ts`:
   - Implement `renderShareCardDataUrl(report, doc = document)` creating a `1080x1920` `<canvas>`, drawing the dark `#020617` -> `#064e3b` background, `@FOOD.CHEM.INTEL // HEALTH-IN-CHECK WATCHDOG` header, `report.product_name`, `report.overall_score` badge, up to 4 `report.hazards` with `risk_level` and `regulatory_status`, FDA recall status strip, and `@food.chem.intel` footer CTA, returning `canvas.toDataURL('image/png')`.
   - Implement `shareOrDownloadReportCard(report, env)`: converts `dataUrl` to a `File` and calls `nav.share({ files: [file], title, text })` when `nav?.canShare?.({ files: [file] })` is true; otherwise creates an `<a download="food-chem-intel-<slug>.png" href={dataUrl}>`, clicks it, and returns `{ method: 'download', dataUrl }`.
2. In `components/Report.tsx`:
   - Add a `"Share @food.chem.intel Story Card"` button calling `shareOrDownloadReportCard(report)` and showing confirmation state (`"Story Card Saved / Shared!"`).
   - Render `hazard.regulatory_status` as a visible badge inside each hazard card.
   - Only render the `"Simulate Hazard"` button when `typeof window !== 'undefined' && window.location.hostname === 'localhost'`.
3. In `components/AdBanner.tsx`: Add `onUpgrade?: () => void` prop and attach `onClick={onUpgrade}` to the `"Upgrade"` button.
4. In `views/ProfileTab.tsx`: Add `onRequestAuth?: () => void` prop; show `"Guest Mode (Local Vault)"` when `!profile.email`, and provide a `"Sign In / Cloud Sync"` button when `isSupabaseConfigured` is true.
5. In `App.tsx`:
   - Remove `if (!hasEnvVars) { return <SetupGuide />; }`.
   - In `useEffect`, always load `getUserProfile()` and transition to `AppState.LANDING` (running `verifyCheckoutReturnFromUrl(window.location.search)` first).
   - Pass `onUpgrade={() => setAppState(AppState.SUBSCRIPTION)}` to `<AdBanner />` and `onRequestAuth={() => setAppState(AppState.AUTH)}` to `<ProfileTab />`.

- [ ] **Step 4: Run test to verify it passes**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/guestAndShareCard.test.tsx --no-file-parallelism`
Expected: PASS (2 passed).

- [ ] **Step 5: Commit**

```bash
git add services/shareCardService.ts components/Report.tsx components/AdBanner.tsx views/ProfileTab.tsx App.tsx test/guestAndShareCard.test.tsx
git commit -m "feat(pwa-ux): enable instant guest mode and 1080x1920 @food.chem.intel story card sharing"
```

---

### Task 5: Installable Offline PWA (`manifest.json` + `sw.js`), Clean Entrypoint & Production Build Gate

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `index.html`
- Modify: `index.tsx`
- Test: `test/pwaAndBuildGate.test.ts`

**Interfaces:**
- Consumes: All modules from Tasks 1–4
- Produces:
  - `public/manifest.json` (Installable Web App Manifest for `@food.chem.intel // Health-In-Check`)
  - `public/sw.js` (Offline-capable Service Worker caching app shell and OpenFDA recall responses)
  - Clean `index.tsx` without unconfigured `@sentry/react` import

- [ ] **Step 1: Write the failing test `test/pwaAndBuildGate.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 5: Installable PWA Assets & Sentry-Free Entrypoint', () => {
  const root = path.resolve(__dirname, '..');

  it('provides a valid standalone Web App Manifest in public/manifest.json and links it in index.html', () => {
    const manifestPath = path.join(root, 'public', 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toContain('Health-In-Check');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#10b981');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);

    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('rel="manifest"');
  });

  it('ships public/sw.js with shell and OpenFDA caching and removes unconfigured @sentry/react from index.tsx', () => {
    const swPath = path.join(root, 'public', 'sw.js');
    expect(fs.existsSync(swPath)).toBe(true);
    const swCode = fs.readFileSync(swPath, 'utf8');
    expect(swCode).toContain('api.fda.gov');
    expect(swCode).toContain('caches.open');

    const indexTsx = fs.readFileSync(path.join(root, 'index.tsx'), 'utf8');
    expect(indexTsx).not.toContain('@sentry/react');
    expect(indexTsx).toContain('serviceWorker');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `NODE_OPTIONS=--max-old-space-size=512 npx vitest run test/pwaAndBuildGate.test.ts --no-file-parallelism`
Expected: FAIL (`public/manifest.json` does not exist).

- [ ] **Step 3: Implement `public/manifest.json`, `public/sw.js`, `index.html`, and `index.tsx`**

1. Create `public/manifest.json` with `name: "Health-In-Check by @food.chem.intel"`, `short_name: "HealthInCheck"`, `start_url: "/"`, `display: "standalone"`, `background_color: "#020617"`, `theme_color: "#10b981"`, and embedded SVG data-URI / icon entries (`192x192`, `512x512`).
2. Create `public/sw.js` caching `/`, `/index.html`, `/manifest.json` on `install`, serving `api.fda.gov` requests via Network-First with cache fallback for offline recall reading, and bypassing cache for `/api/generate` and `/api/checkout`.
3. Add `<link rel="manifest" href="/manifest.json" />` to `index.html`.
4. Remove `import * as Sentry from "@sentry/react"` and `Sentry.init(...)` from `index.tsx` and register `/sw.js` on window `load` when `'serviceWorker' in navigator`.

- [ ] **Step 4: Run full Vitest suite and production build to verify everything passes within the 4 GB Chromebook and `< 1 MB` bundle budgets**

Run: `npm test && npm run build`
Expected: All 4 test suites PASS (`test/deterministicAnalyzer.test.ts`, `test/geminiHybridService.test.ts`, `test/paymentAndAuth.test.ts`, `test/guestAndShareCard.test.tsx`, `test/pwaAndBuildGate.test.ts`) and `vite build` succeeds with gzipped JS bundle `< 250 KB` (`< 1 MB` cap).

- [ ] **Step 5: Commit**

```bash
git add public/manifest.json public/sw.js index.html index.tsx test/pwaAndBuildGate.test.ts
git commit -m "feat(pwa): add manifest.json, offline service worker, and clean production build"
```
