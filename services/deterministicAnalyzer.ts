import { KNOWLEDGE_BASE } from '../constants';
import {
  AnalysisReport,
  Hazard,
  KnowledgeBaseItem,
  NutrientBlocker,
  PositiveAttribute,
  Recall,
  RecallFeedItem,
  Substitution,
  UserProfile
} from '../types';

const RECALL_STOPWORDS = new Set([
  'food',
  'water',
  'milk',
  'salt',
  'acid',
  'sugar',
  'natural',
  'organic',
  'product',
  'unknown',
  'with',
  'from',
  'pure',
  'fresh',
  'pack',
  'free'
]);

const WHOLE_FOOD_BENEFITS: Array<{ keywords: string[]; name: string; benefit: string; usda_category: string }> = [
  { keywords: ['olive oil', 'extra virgin olive'], name: 'Extra Virgin Olive Oil', benefit: 'Rich in monounsaturated oleic acid and anti-inflammatory polyphenols (oleocanthal).', usda_category: 'Healthy Lipid' },
  { keywords: ['avocado oil'], name: 'Avocado Oil', benefit: 'High-smoke-point monounsaturated fat free of industrial hexane seed extraction.', usda_category: 'Healthy Lipid' },
  { keywords: ['oats', 'rolled oats', 'whole grain'], name: 'Whole Grain Fiber', benefit: 'Provides beta-glucan soluble fiber supporting glycemic stability and lipid clearance.', usda_category: 'Whole Grain' },
  { keywords: ['whey', 'pea protein', 'egg', 'salmon', 'beef', 'chicken'], name: 'Bioavailable Protein', benefit: 'Supplies essential amino acids and leucine for muscle protein synthesis.', usda_category: 'Protein' },
  { keywords: ['blueberry', 'strawberry', 'raspberry', 'cocoa', 'cacao', 'turmeric', 'ginger'], name: 'Polyphenol Antioxidants', benefit: 'Delivers phytonutrients that combat oxidative cellular stress.', usda_category: 'Phytonutrient' }
];

function normalizeText(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[-_/()[\],.;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(str: string): string {
  return str
    .split(' ')
    .filter(Boolean)
    .map(w => (w.length <= 3 && /^(bha|bht|bvo|hfcs|iv)$/i.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

function matchesTermOrAliases(normalizedBlob: string, canonicalKey: string, item: KnowledgeBaseItem): boolean {
  const candidates = [canonicalKey, ...(item.aliases || [])];
  for (const rawCandidate of candidates) {
    const c = normalizeText(rawCandidate);
    if (!c) continue;
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');
    if (regex.test(normalizedBlob)) {
      return true;
    }
  }
  return false;
}

export function matchKnowledgeBase(ingredients: string[]): { hazards: Hazard[]; blockers: NutrientBlocker[] } {
  const normalizedList = (ingredients || []).map(normalizeText).filter(Boolean);
  const fullBlob = normalizedList.join(' ');
  const hazards: Hazard[] = [];
  const seenKeys = new Set<string>();

  const addMatchesFromTable = (table: Record<string, KnowledgeBaseItem>) => {
    for (const [key, item] of Object.entries(table)) {
      if (seenKeys.has(key)) continue;
      const targetBlob = key === 'refined seed oils'
        ? fullBlob.replace(/\bbrominated vegetable oil\b/g, '')
        : fullBlob;
      if (matchesTermOrAliases(targetBlob, key, item)) {
        seenKeys.add(key);
        hazards.push({
          name: titleCase(key),
          risk_level: item.risk_level,
          function: item.function || item.origin || 'Food Additive',
          health_impact: item.origin ? `${item.origin} ${item.health_impact}` : item.health_impact,
          regulatory_status: item.regulatory_status || '🇺🇸 USA: Legal | Global: Varies',
          verdict: item.verdict,
          citation_source: item.citation_source || 'Peer-Reviewed Toxicology Registry',
          citation_url: item.citation_url || ''
        });
      }
    }
  };

  addMatchesFromTable(KNOWLEDGE_BASE.hazardous_additives);
  addMatchesFromTable(KNOWLEDGE_BASE.deceptive_ingredients);

  const blockers: NutrientBlocker[] = [];
  for (const blocker of KNOWLEDGE_BASE.nutrient_blockers) {
    const [first, second] = blocker.pair;
    const hasFirst = matchesTermOrAliases(fullBlob, first, { risk_level: '', health_impact: '', verdict: '' });
    const hasSecond = matchesTermOrAliases(fullBlob, second, { risk_level: '', health_impact: '', verdict: '' });
    if (hasFirst && hasSecond) {
      blockers.push(blocker);
    }
  }

  return { hazards, blockers };
}

export function matchUserAllergies(ingredients: string[], allergiesCsv?: string): string[] {
  if (!allergiesCsv || !allergiesCsv.trim() || allergiesCsv.trim().toLowerCase() === 'none') {
    return [];
  }
  const fullBlob = (ingredients || []).map(normalizeText).join(' ');
  if (!fullBlob) return [];

  const declaredAllergens = allergiesCsv
    .split(/[,;\n]+/)
    .map(a => normalizeText(a))
    .filter(a => a && a !== 'none');

  const warnings: string[] = [];
  for (const allergen of declaredAllergens) {
    const singular = allergen.endsWith('s') && allergen.length > 4 ? allergen.slice(0, -1) : allergen;
    const escaped = singular.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escaped}s?(?:$|\\s)`, 'i');
    if (regex.test(fullBlob)) {
      warnings.push(`Contains declared allergen: ${titleCase(allergen)}`);
    }
  }
  return warnings;
}

export function matchRealRecalls(
  productName: string | undefined,
  ingredients: string[],
  recallFeed: RecallFeedItem[]
): Recall[] {
  if (!Array.isArray(recallFeed) || recallFeed.length === 0) return [];
  const normProduct = normalizeText(productName || '');
  const productTokens = normProduct
    .split(' ')
    .filter(tok => tok.length >= 4 && !RECALL_STOPWORDS.has(tok));

  // Require at least 2 meaningful product tokens (or a >= 7 char distinctive token) to prevent false positives on generic words
  if (productTokens.length === 0) return [];

  const matched: Recall[] = [];
  for (const item of recallFeed) {
    const haystack = normalizeText(`${item.brand_names || ''} ${item.description || ''} ${item.hazard || ''}`);
    if (!haystack) continue;

    const matchingTokens = productTokens.filter(tok => haystack.includes(tok));
    const isStrongMatch =
      (productTokens.length >= 2 && matchingTokens.length >= 2) ||
      (productTokens.length === 1 && productTokens[0].length >= 7 && matchingTokens.length === 1);

    if (isStrongMatch) {
      matched.push({
        reason: item.hazard || 'FDA Enforcement Recall',
        date: item.date || 'Recent',
        description: `${item.brand_names ? item.brand_names + ': ' : ''}${item.description} (${item.action_required})`,
        source: 'Official OpenFDA Enforcement Registry'
      });
    }
  }
  return matched;
}

export function buildDeterministicReport(params: {
  ingredients: string[];
  productName?: string;
  userProfile?: UserProfile;
  recallFeed?: RecallFeedItem[];
}): AnalysisReport {
  const ingredients = Array.isArray(params.ingredients) ? params.ingredients : [];
  const productName = params.productName?.trim() || 'Scanned Food Product';
  const { hazards, blockers } = matchKnowledgeBase(ingredients);
  const allergyWarnings = matchUserAllergies(ingredients, params.userProfile?.allergies);
  const recalls = matchRealRecalls(productName, ingredients, params.recallFeed || []);

  const fullBlob = ingredients.map(normalizeText).join(' ');
  const positives: PositiveAttribute[] = [];
  for (const wf of WHOLE_FOOD_BENEFITS) {
    if (wf.keywords.some(kw => fullBlob.includes(kw))) {
      positives.push({
        name: wf.name,
        benefit: wf.benefit,
        usda_category: wf.usda_category
      });
    }
  }

  let score = 95;
  for (const h of hazards) {
    const level = h.risk_level.toUpperCase();
    if (level.includes('CRITICAL')) score -= 28;
    else if (level.includes('HIGH')) score -= 18;
    else if (level.includes('MODERATE') && !level.includes('LOW')) score -= 12;
    else score -= 6;
  }
  if (recalls.length > 0) score -= 35;
  if (allergyWarnings.length > 0) score -= 25;
  if (hazards.length === 0 && positives.length > 0) {
    score = Math.min(98, score + positives.length * 2);
  }
  const overallScore = Math.max(5, Math.min(100, Math.round(score)));

  const substitutions: Substitution[] = [];
  if (hazards.some(h => /red 40|yellow 5|yellow 6|blue 1|titanium dioxide/i.test(h.name))) {
    substitutions.push({
      name: 'Dye-Free Organic Equivalent (Beet / Turmeric / Spirulina colored)',
      reason: 'Eliminates petroleum-derived synthetic azo dyes and nanoparticle whiteners.'
    });
  }
  if (hazards.some(h => /seed oils|bha|bht|tbhq/i.test(h.name))) {
    substitutions.push({
      name: '100% Extra Virgin Olive Oil, Avocado Oil, or Grass-Fed Butter',
      reason: 'Replaces hexane-extracted Omega-6 seed oils and synthetic lipid preservatives.'
    });
  }
  if (hazards.some(h => /high fructose corn syrup|maltodextrin|acesulfame/i.test(h.name))) {
    substitutions.push({
      name: 'Whole Fruit, Raw Honey, or Pure Monk Fruit Sweetened Option',
      reason: 'Avoids rapid hepatic lipogenesis and high-glycemic starch spikes.'
    });
  }

  const summary =
    hazards.length === 0 && recalls.length === 0
      ? `Clean label profile detected for ${productName} with zero flagged synthetic additives in the @food.chem.intel database.`
      : `Flagged ${hazards.length} chemical additive(s)${recalls.length ? ` and ${recalls.length} active FDA recall match(es)` : ''} in ${productName}. Review regulatory citations below.`;

  return {
    timestamp: Date.now(),
    product_name: productName,
    ingredients_detected: ingredients,
    hazards,
    positives,
    blockers,
    substitutions,
    recalls,
    allergy_warnings: allergyWarnings,
    drug_interactions: [],
    exercise_tip: 'A 10-minute post-meal brisk walk improves GLUT4 glucose disposal and reduces postprandial glycemic excursions.',
    summary,
    overall_score: overallScore
  };
}
